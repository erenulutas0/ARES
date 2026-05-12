# A-RES Güncellenmiş Sistem Tasarımı — Kapsamlı Araştırma Raporu

> **Hazırlayan:** Antigravity AI (Gemini) — Claude karşılaştırması için hazırlanmıştır  
> **Tarih:** 12 Mayıs 2026  
> **Proje:** A-RES — Updated Smart Building Emergency Response System  
> **Referans:** STATIC_VULNERABILITY_SYSTEM_REPORT_TR.md (son güncelleme)

---

## 1. SİSTEMİN SON HALİ — ÖZET

Güncellenmiş A-RES mimarisi üç bilgi kaynağına dayanır:

| # | Kaynak | Tip | Veri |
|---|--------|-----|------|
| 1 | Occupancy Sensor / Entrance Camera | Gerçek zamanlı | Anonim kişi sayısı |
| 2 | Fire-Gas Sensor (MQ-2, MQ-7, BME280) | Gerçek zamanlı | Duman, gaz, sıcaklık |
| 3 | Building Vulnerability Data Module | Statik | Bina yaşı, yapı tipi, kat, zemin, bitişik durum |

**Mimari akış:** Sensörler → Building Edge Hub → MQTT/HTTP → Central Coordination System → AFAD-like Dashboard

> [!IMPORTANT]
> Structural health sensor MVP'den çıkarıldı. Yerine statik bina zafiyet modülü konuldu. Bu karar akademik savunulabilirlik ve fizibilite açısından doğrudur.

---

## 2. PROTOKOL SEÇİMİ VE KARŞILAŞTIRMASI

### 2.1 Edge → Central İletişim: MQTT v5

| Özellik | MQTT | CoAP | AMQP | HTTP REST |
|---------|------|------|------|-----------|
| Model | Pub/Sub | Request/Response | Message Queue | Request/Response |
| Transport | TCP | UDP | TCP | TCP |
| Overhead | Düşük (2-byte header) | Çok düşük | Yüksek | Yüksek |
| QoS | 3 seviye (0,1,2) | Confirmable/Non | Transactional | Yok |
| Offline Queue | Evet (QoS 1/2) | Sınırlı | Evet | Hayır |
| IoT Uygunluğu | ★★★★★ | ★★★★ | ★★★ | ★★ |

**Karar: MQTT v5 over TLS (port 8883)**

**Gerekçe:** 
- Pub/Sub modeli çok sayıda binadan merkeze veri akışı için ideal
- QoS 1 (at-least-once) deprem sonrası güvenilir teslimat sağlar
- Last Will and Testament (LWT) — cihaz çevrimdışı olursa merkez anında bilgilendirilir
- Retained messages — yeni subscriber'lar son durumu anında alır
- 2-byte minimum header ile bant genişliği tasarrufu

### 2.2 Central → Dashboard: WebSocket (wss://)

- Gerçek zamanlı push güncellemeler için WebSocket
- Fallback: Server-Sent Events (SSE) veya 5sn polling

### 2.3 Topic Yapısı

```
ares/building/{building_id}/sensor      → Fire-gas sensör verileri
ares/building/{building_id}/occupancy   → Kişi sayısı delta
ares/building/{building_id}/status      → Heartbeat/health
ares/building/{building_id}/alarm       → Lokal alarm bildirimleri
ares/system/alerts                      → Sistem geneli uyarılar
ares/system/earthquake                  → Deprem tetikleme eventi
```

---

## 3. VERİ TOPLAMA, DEPOLAMA VE MANİPÜLASYON POLİTİKALARI

### 3.1 Veri Toplama Katmanları

**Edge Katmanı (Bina İçi):**
- Sensörler → ESP32 → Edge Hub (Raspberry Pi)
- Kamera → YOLO11n + ByteTrack → Anonim sayım
- Örnekleme: Sensör 1/sn, kamera 10-15 FPS
- Yerel filtreleme: Moving average, eşik kontrolü

**Central Katmanı:**
- MQTT subscriber → Pydantic validation → Dedup → Store → Score → Push

### 3.2 Depolama Mimarisi

| Bileşen | Teknoloji | Amaç | Retention |
|---------|-----------|------|-----------|
| Live State | Redis 7 (Hash) | Son bina durumu, anlık occupancy | Sürekli güncel |
| Time-Series | PostgreSQL 16 + pg_partman | Sensör okumaları, olaylar | 90 gün (sıcak), arşiv (soğuk) |
| Building Registry | PostgreSQL 16 | Bina bilgileri, vulnerability index | Kalıcı |
| Urgency History | PostgreSQL 16 | Score geçmişi, trend analizi | 1 yıl |
| Edge Buffer | SQLite (RPi) / SPIFFS (ESP32) | Offline buffer | 1000 kayıt circular |
| Dedup Cache | Redis SET + TTL | Tekrar mesaj engelleme | 1 saat TTL |

**Neden PostgreSQL + Redis (TimescaleDB değil)?**
- MVP ölçeğinde (5-50 bina) saf PostgreSQL yeterli
- `pg_partman` ile aylık partition yapılabilir
- 50+ bina ölçeğine geçişte TimescaleDB extension eklenebilir
- Redis: Sub-millisecond live state erişimi

### 3.3 Veri Akış Diyagramı

```
Sensör/Kamera → Edge Hub → Lokal eşik kontrolü → Alarm? → Lokal siren
                                ↓
                    MQTT Publish (QoS 1, TLS)
                                ↓
                    Mosquitto Broker (port 8883)
                                ↓
                    FastAPI MQTT Subscriber
                                ↓
                    Pydantic Validation → Dedup (Redis SET)
                                ↓
                    PostgreSQL (append-only) + Redis (live state)
                                ↓
                    Urgency Score Engine → Recalculate
                                ↓
                    WebSocket Push → Dashboard
```

### 3.4 Veri Manipülasyon Kuralları

1. **Append-Only:** Sensör verileri asla güncellenmez, sadece eklenir
2. **Idempotent Processing:** `(building_id, device_id, seq)` UNIQUE constraint
3. **Stale Data Decay:** 30sn → fresh, 120sn → aging, 300sn+ → stale (confidence düşer)
4. **Precautionary Principle:** Düşük güven = skor artışı (bilinmeyen tehlikeli kabul edilir)

---

## 4. KOORDİNASYON SİSTEMİNE VERİ AKIŞI — PERFORMANS OPTİMİZASYONU

### 4.1 Edge → Central Optimizasyonu

| Strateji | Açıklama |
|----------|----------|
| Delta encoding | Sadece değişen veriler gönderilir |
| Summarized messages | Ham veri değil, özet risk mesajı |
| Batch buffering | Offline durumda circular buffer, reconnect'te flush |
| Compression | MQTT v5 payload compression (zlib) |
| Heartbeat | 30sn aralıklı, 3 kaçırma = offline |

### 4.2 Beklenen Latency (MVP)

| Segment | Beklenen Süre |
|---------|---------------|
| Sensör → Edge Hub | < 50ms (lokal) |
| Edge Hub → MQTT Broker | < 200ms (Wi-Fi/LAN) |
| MQTT → FastAPI processing | < 100ms |
| Score calculation | < 50ms |
| WebSocket push → Dashboard | < 50ms |
| **Toplam End-to-End** | **< 500ms** |

---

## 5. URGENCY SCORE TASARIMI

### 5.1 Güncellenmiş Formül (Structural Sensor Çıkarıldı)

Eski sistemde `shaking_score` (PGA-based) vardı. Yeni sistemde structural sensor olmadığı için ağırlıklar yeniden düzenlendi:

```python
urgency_score = (
    occupancy_risk      * 0.35 +
    fire_gas_risk        * 0.30 +
    vulnerability_risk   * 0.25 +
    confidence_adjustment * 0.10
)
```

### 5.2 Her Bileşenin Hesaplanması

**Occupancy Risk (0-100):**
| Kişi Sayısı | Skor |
|-------------|------|
| 0 | 0 |
| 1-5 | 20 |
| 6-20 | 40 |
| 21-50 | 60 |
| 51-100 | 80 |
| 100+ | 100 |

**Fire-Gas Risk (0-100):**
- Yangın algılandı: 100
- Sadece duman: 50
- Gaz kaçağı: 100 (bağımsız booster)
- Yüksek sıcaklık (>60°C): +25 bonus
- Toplam = min(100, fire + gas + temp_bonus)

**Vulnerability Risk (0-100):**
```
vulnerability_index × 100
(statik olarak building registry'den gelir)
```

**Confidence Adjustment:**
- confidence < 0.5 → +(1-confidence) × 15 puan (precautionary boost)
- Stale data → confidence düşer → skor yükselir

### 5.3 Priority Seviyeleri ve Aksiyon

| Skor | Seviye | Renk | Aksiyon |
|------|--------|------|---------|
| 0-30 | LOW | 🟢 | Pasif izleme |
| 31-60 | MEDIUM | 🟡 | Müsait olunca denetim ekibi |
| 61-80 | HIGH | 🟠 | Kurtarma/itfaiye sevk |
| 81-100 | CRITICAL | 🔴 | Tüm ekipler acil sevk |

### 5.4 Deprem Sonrası Tetikleme Mekanizması

> [!WARNING]
> A-RES deprem tahmini yapmaz. Deprem olduktan sonra AFAD/USGS gibi kaynaklardan tetikleme alır.

Tetikleme sonrası:
1. Tüm edge hub'lar "earthquake mode" a geçer
2. Sensör örnekleme frekansı artar (1/sn → 5/sn)
3. Urgency score sürekli yeniden hesaplanır
4. Dashboard CRITICAL öncelikli sıralama yapar

---

## 6. İLGİLİ KURUMA VERİ GÖNDERİMİ

### 6.1 Çıktı Tüketicileri

| Kurum | Aldığı Veri | Format |
|-------|-------------|--------|
| AFAD benzeri acil durum merkezi | Tüm binalar priority sıralı | Dashboard + REST API |
| Kurtarma ekipleri | CRITICAL binalar, occupancy | Push notification + API |
| İtfaiye | Fire/gas alarm olan binalar | Push notification |
| Belediye denetim ekipleri | HIGH vulnerability binalar | Rapor + API |
| Kentsel dönüşüm planlaması | Vulnerability index ranking | CSV export + API |

### 6.2 API Tasarımı (FastAPI)

```
GET  /api/v1/buildings                    → Tüm binalar
GET  /api/v1/buildings/{id}               → Tek bina detay
GET  /api/v1/buildings/priority           → Priority sıralı liste
GET  /api/v1/urgency/current              → Anlık tüm skorlar
GET  /api/v1/urgency/{id}/history         → Skor geçmişi
POST /api/v1/earthquake/trigger           → Manuel deprem tetikleme
WS   /ws/dashboard                        → Real-time WebSocket feed
GET  /api/v1/export/csv                   → IE optimizasyon verisi
```

---

## 7. BUILDING VULNERABILITY DATA — VERİ KAYNAKLARI VE ERİŞİM

### 7.1 Veri Kaynakları Tablosu

| Veri | Kaynak | Erişim Yöntemi | Zorluk |
|------|--------|----------------|--------|
| Bina yaşı | Yapı ruhsatı / iskan belgesi | Belediye arşivi, e-Devlet, BKS | Orta |
| Yapı tipi | Statik proje, yapı ruhsatı | Belediye İmar Müdürlüğü | Orta |
| Kat sayısı | Yapı ruhsatı, BKS | e-Devlet, belediye | Kolay |
| Bitişik durum | İmar planı, kadastro haritası | TKGM parcel sorgu, belediye | Kolay |
| Zemin sınıfı | Zemin etüdü raporu | Belediye arşivi (ruhsat dosyası) | Zor |
| Sismik tehlike | AFAD Deprem Tehlike Haritası | tdth.afad.gov.tr (web) | Kolay |

### 7.2 Spesifik Kaynaklar

1. **Bina Kimlik Sistemi (BKS):** 2021+ binalar için zorunlu. QR kod ile erişim.
2. **AFAD TDTH:** tdth.afad.gov.tr — interaktif harita, ivme değerleri
3. **TADAS:** tadas.afad.gov.tr — mühendislik ivme verileri
4. **TKGM/MEGSIS:** Parsel sorgulama, kadastral haritalar
5. **e-Devlet:** Yapı ruhsatı ve iskan belgesi sorgulama
6. **Belediye arşivleri:** 4982 sayılı Bilgi Edinme Kanunu kapsamında talep

### 7.3 MVP İçin Pratik Yaklaşım

> MVP'de gerçek belediye verileri yerine **simülasyon verisi** kullanılır. 5-10 bina için manuel olarak building registry oluşturulur. Gerçek deployment'ta yukarıdaki kaynaklardan veri çekilir.

---

## 8. YASAL BOYUT — VERİ TOPLAMA KANUN ANALİZİ

### 8.1 KVKK (6698 sayılı Kanun) Analizi

| Veri Tipi | Kişisel Veri mi? | KVKK Kapsamı | Gerekçe |
|-----------|------------------|--------------|---------|
| Bina yaşı, yapı tipi, kat sayısı | ❌ Hayır | Kapsam dışı | Gerçek kişiye ilişkin değil, bina verisi |
| Zemin etüdü, sismik tehlike | ❌ Hayır | Kapsam dışı | Coğrafi/jeolojik veri |
| Bitişik bina durumu | ❌ Hayır | Kapsam dışı | Fiziksel konum verisi |
| Anonim occupancy sayısı | ❌ Hayır | Kapsam dışı | Kimliği belirlenemez toplu sayım |
| Duman/gaz sensör verisi | ❌ Hayır | Kapsam dışı | Çevresel ölçüm |
| Kamera ham videosu | ⚠️ Potansiyel | Edge'de kalır | Asla merkeze gönderilmez |

> [!TIP]
> A-RES'in en güçlü yanı: **Ham video asla edge cihazdan çıkmaz.** Sadece anonim sayı (count_delta) gönderilir. Bu KVKK/GDPR uyumludur.

### 8.2 Dikkat Edilmesi Gerekenler

1. **Kamera görüntüleri:** Edge'de işlenir, merkeze GÖNDERİLMEZ
2. **Anonim sayım:** Yüz tanıma YOK, kimlik tespiti YOK
3. **Bina verileri:** Kişisel veri değil, kamu verisi niteliğinde
4. **Bilgi Edinme Kanunu (4982):** Belediyelerden bina verisi talep etmek yasal haktır
5. **Aydınlatma yükümlülüğü:** Kamera olan girişlerde bilgilendirme tabelası asılmalı

### 8.3 Risk: Dolaylı Kişi Tespiti

> [!WARNING]
> Eğer bir binada çok az kişi varsa (örn: 1 kişi), occupancy verisi dolaylı olarak kişi tespitine yol açabilir. Bu riski minimize etmek için: minimum threshold (5 kişi altı → "az" olarak raporla), zaman aralığı aggregation (5 dakikalık ortalama).

---

## 9. VERİ KORUMA — GÜVENLİK MİMARİSİ

### 9.1 Katmanlı Güvenlik Mimarisi

```
┌─────────────────────────────────┐
│  Layer 5: Erişim Kontrolü       │  JWT auth, RBAC, dashboard login
├─────────────────────────────────┤
│  Layer 4: Uygulama Güvenliği    │  Input validation, rate limiting
├─────────────────────────────────┤
│  Layer 3: Transit Şifreleme     │  TLS 1.3 (MQTT), WSS (dashboard)
├─────────────────────────────────┤
│  Layer 2: At-Rest Şifreleme     │  AES-256, PostgreSQL encryption
├─────────────────────────────────┤
│  Layer 1: Ağ Segmentasyonu      │  VLAN, firewall, IoT isolation
└─────────────────────────────────┘
```

### 9.2 Protokol Bazlı Güvenlik

| Katman | Protokol/Araç | Amaç |
|--------|---------------|------|
| MQTT | TLS 1.3 (port 8883) | Transit şifreleme |
| MQTT Auth | Username/password + ACL | Cihaz kimlik doğrulama |
| MQTT (gelecek) | mTLS (X.509 certificates) | Karşılıklı sertifika doğrulama |
| API | JWT Bearer tokens | Kullanıcı auth |
| Dashboard | HTTPS + WSS | Web güvenliği |
| Database | PostgreSQL ssl + pgcrypto | At-rest şifreleme |
| Edge Buffer | AES-256 (lokal) | Offline veri koruma |

### 9.3 MVP vs Production Güvenlik

| Özellik | MVP | Production |
|---------|-----|------------|
| MQTT Auth | Username/password | mTLS (X.509) |
| TLS | Self-signed cert | Let's Encrypt / CA signed |
| API Auth | Basit JWT | OAuth 2.0 + RBAC |
| Network | Tek ağ | VLAN segmentasyonu |
| Key Management | Config file | HSM / Vault |
| Audit Log | Basit log | Tamper-proof audit trail |

---

## 10. NETWORK ALTYAPISI — KESİNTİSİZ ÇALIŞMA

### 10.1 High Availability Mimarisi

```
                    ┌─── Primary: Fiber/Broadband ───┐
Building Edge Hub ──┤                                 ├── Central Server
                    └─── Backup: 4G/5G Cellular ─────┘
                                                          ↓
                                              ┌── Active Server ──┐
                                              │   FastAPI + Redis  │
                                              │   PostgreSQL       │
                                              └────────┬───────────┘
                                                       │ (failover)
                                              ┌────────┴───────────┐
                                              │   Standby Server   │
                                              │   (hot standby)    │
                                              └────────────────────┘
```

### 10.2 Failover Stratejileri

| Senaryo | Çözüm |
|---------|-------|
| İnternet kesintisi (edge) | Lokal alarm devam eder + SQLite/SPIFFS buffer |
| MQTT broker down | Exponential backoff retry + edge local buffer |
| Central server crash | systemd auto-restart + PostgreSQL WAL recovery |
| Elektrik kesintisi (edge) | UPS (RPi) + batarya (ESP32) |
| Elektrik kesintisi (central) | UPS + cloud VPS failover |
| DNS failure | Statik IP fallback |

### 10.3 Edge Autonomy (Merkez Bağımsız Çalışma)

> [!IMPORTANT]
> Edge hub, merkez ile bağlantı kesilse bile bağımsız çalışabilmelidir. Bu deprem senaryosu için kritiktir.

Edge hub bağımsız olarak yapabilir:
1. ✅ Sensör verisi toplama (devam eder)
2. ✅ Lokal eşik kontrolü (devam eder)
3. ✅ Lokal alarm tetikleme (siren/LED) (devam eder)
4. ✅ Veri bufferlama (devam eder)
5. ❌ Diğer binalarla karşılaştırma (merkez gerekli)
6. ❌ Şehir geneli önceliklendirme (merkez gerekli)

### 10.4 MVP Network Topolojisi

```
Laptop (Central Server)
├── Docker: Mosquitto (MQTT Broker) - port 1883/8883
├── Docker: PostgreSQL - port 5432
├── Docker: Redis - port 6379
├── FastAPI Backend - port 8000
└── Dashboard - port 3000

Edge Simülasyonu: Aynı laptop üzerinde Python script
Gerçek Edge: Raspberry Pi + ESP32 (Wi-Fi ile aynı LAN)
```

### 10.5 Production Network Topolojisi (Gelecek)

| Bileşen | Teknoloji | Redundancy |
|---------|-----------|------------|
| MQTT Broker | EMQX Cluster (3 node) | Active-Active |
| API Server | FastAPI (3 instance) + Nginx LB | Load balanced |
| Database | PostgreSQL (primary + streaming replica) | Hot standby |
| Cache | Redis Sentinel (3 node) | Auto-failover |
| Edge → Cloud | Primary: fiber + Backup: 4G | Dual-path |
| Monitoring | Prometheus + Grafana | Health checks |

---

## 11. ROADMAP — İMPLEMENTASYON PLANI

### Phase 1: MVP Demo (Hafta 1-2)
- [ ] Building registry (5-10 bina, JSON/CSV)
- [ ] Vulnerability index hesaplama
- [ ] Simüle sensör verisi (MQTT publish)
- [ ] Occupancy counting (video test)
- [ ] FastAPI backend + MQTT subscriber
- [ ] Urgency score engine
- [ ] Basit dashboard

### Phase 2: Entegrasyon (Hafta 3-4)
- [ ] End-to-end: kamera → MQTT → score → dashboard
- [ ] Fire-gas simülasyonu
- [ ] 5 bina senaryosu
- [ ] Latency ölçümü
- [ ] Dashboard polish

### Phase 3: Test & Doğrulama (Hafta 5)
- [ ] Accuracy metrikleri
- [ ] Edge case testleri (offline, duplicate)
- [ ] Demo video kaydı
- [ ] Rapor yazımı

### Phase 4: Gelecek (Post-MVP)
- [ ] Gerçek belediye verisi entegrasyonu
- [ ] mTLS güvenlik
- [ ] AFAD API entegrasyonu
- [ ] Gerçek structural health sensor (R&D)
- [ ] EMQX cluster + TimescaleDB

---

## 12. CLAUDE İÇİN KARŞILAŞTIRMA NOTLARI

> Bu bölüm Claude'a gönderilecek rapor için hazırlanmıştır. Claude'dan şu konularda alternatif görüş istenebilir:

1. **Urgency Score ağırlıkları:** Mevcut 35/30/25/10 dağılımı optimal mi?
2. **MQTT vs gRPC:** Edge hub'dan merkeze gRPC kullanmak avantaj sağlar mı?
3. **Building vulnerability index formülü:** Ağırlıklar (0.25/0.20/0.10/0.15/0.20/0.10) için alternatif?
4. **Stale data handling:** Precautionary boost yerine Bayesian approach daha iyi mi?
5. **Legal risk:** Kamera aydınlatma metni için spesifik KVKK template önerisi?
6. **Edge autonomy:** Mesh networking (edge-to-edge) deprem senaryosunda gerekli mi?
7. **Data retention:** 90 gün sıcak + arşiv politikası yeterli mi?

---

## 13. SONUÇ VE ÖNERİLER

| Alan | Öneri | Öncelik |
|------|-------|---------|
| Protokol | MQTT v5 + TLS 1.3 | ✅ Kesinleşmiş |
| Depolama | PostgreSQL + Redis | ✅ Kesinleşmiş |
| Güvenlik | Katmanlı (transit + at-rest + auth) | ✅ MVP için basit, üretim için güçlü |
| Veri kaynakları | MVP simülasyon, üretim belediye/BKS | ✅ Kanuni sorun yok |
| KVKK | Kapsam dışı (anonim + bina verisi) | ✅ Güvenli |
| Network | Edge autonomy + central coordination | ✅ Hibrit mimari |
| Urgency Score | Rule-based MVP, ML-based gelecek | ✅ Savunulabilir |

> **En kritik tasarım kararı:** Edge hub'ların merkez bağımsız lokal alarm verebilmesi. Deprem sonrası ağ altyapısı zarar görebilir — bu durumda bile her bina kendi alarm kararını verebilmelidir.
