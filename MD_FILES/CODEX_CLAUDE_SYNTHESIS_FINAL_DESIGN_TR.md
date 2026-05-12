# CODEX + Claude/Gemini Sentezi — A-RES Final Sistem Tasarım Kararı

## 1. Amaç

Bu doküman, A-RES için hazırlanan CODEX raporu ile Claude/Gemini tarafından hazırlanan `ARES_SYSTEM_RESEARCH_REPORT.md` raporunu sentezler. Amaç, son sistem mimarisini tek bir tutarlı karar dokümanına dönüştürmektir.

Son karar şudur:

```text
A-RES = Occupancy sensing + Fire-gas sensing + Static building vulnerability module
        + Building edge hub
        + Lightweight central coordination
        + AFAD-like dashboard/API
```

Structural health sensor MVP kapsamından çıkarılmıştır. Bunun yerine bina yaşı, yapı tipi, kat sayısı, bitişik nizam, zemin sınıfı ve lokal deprem tehlikesi gibi statik bina kırılganlık verileri kullanılacaktır.

## 2. Son Sistem Mimarisi

Güncel mimari üç veri kaynağına dayanır:

| Kaynak | Tip | Amaç |
|---|---|---|
| Occupancy sensor / entrance camera | Gerçek zamanlı | Binadaki tahmini kişi sayısı |
| Fire-gas sensor | Gerçek zamanlı | Yangın, duman, gaz ve sıcaklık riski |
| Building vulnerability data module | Statik / yarı-statik | Binanın deprem sonrası göreli risk seviyesi |

Akış:

```text
Building sensors and registry data
        -> Building edge hub
        -> MQTT/HTTP
        -> Lightweight central coordination
        -> Urgency score
        -> AFAD-like dashboard/API
```

## 3. Claude/Gemini Raporundan Alınacak Güçlü Noktalar

Claude/Gemini raporundaki şu bölümler güçlü ve kullanılabilir:

- MQTT v5 over TLS önerisi
- WebSocket/SSE dashboard güncellemeleri
- Redis live state + PostgreSQL historical store ayrımı
- Deduplication için `(building_id, device_id, seq)` yaklaşımı
- Edge buffer / offline flush mantığı
- Urgency score bileşenlerinin yeni sisteme göre düzenlenmesi
- Edge autonomy vurgusu
- Roadmap yapısı

Özellikle şu çizgi doğru:

```text
Edge hub fast local reaction sağlar.
Central coordination ise çoklu bina karşılaştırması ve kurum dashboard'u sağlar.
```

## 4. CODEX Tarafından Düzeltilmesi Gereken Noktalar

Claude/Gemini raporunda teknik olarak iyi fikirler olsa da bazı ifadeler fazla kesin yazılmıştır. Final raporda daha temkinli ve akademik dil kullanılmalıdır.

### 4.1 KVKK İçin Daha Temkinli Dil

Çok kesin ifade:

```text
Anonim occupancy sayısı KVKK kapsam dışıdır.
Kanuni sorun yoktur.
```

Önerilen güvenli ifade:

```text
Ham video saklanmadığı, merkeze gönderilmediği ve yüz tanıma yapılmadığı sürece kişisel veri riski önemli ölçüde azalır. Ancak kamera kullanımı nedeniyle bilgilendirme, erişim kontrolü, saklama politikası ve KVKK değerlendirmesi yine gereklidir.
```

### 4.2 Building Vulnerability Verisi İçin Daha Güvenli Dil

Bina yaşı, zemin, yapı tipi ve bitişik nizam tek başına genellikle kişi verisi değildir. Ancak açık adres, malik bilgisi veya daire sakini bilgisiyle birleşirse hassas hale gelebilir.

Önerilen ifade:

```text
Building vulnerability data should be stored as building-level technical data. Owner, resident, phone number, identity number, or apartment-level personal information should not be collected.
```

### 4.3 AFAD Entegrasyonu İçin Daha Gerçekçi Dil

Doğrudan AFAD sistemine bağlandığımızı iddia etmek yerine:

```text
A-RES provides an AFAD-like dashboard/API that can support emergency authorities.
```

Bu daha gerçekçidir. Gerçek AFAD entegrasyonu gelecekte kurum protokolü gerektirir.

### 4.4 MQTT Compression İfadesi

MQTT v5 doğrudan payload compression standardı gibi anlatılmamalıdır. Daha doğru ifade:

```text
If payload size becomes a problem, compression can be implemented at the application layer.
```

## 5. Final Protokol Kararları

| Katman | Önerilen Protokol / Teknoloji | Gerekçe |
|---|---|---|
| Edge hub -> central telemetry | MQTT v5 over TLS | Hafif, IoT uyumlu, QoS destekli |
| Dashboard canlı veri | WebSocket veya SSE | Gerçek zamanlı güncelleme |
| Authority / report API | HTTPS REST API | Kurum entegrasyonu ve raporlama için uygun |
| Future alert interoperability | CAP 1.2 | Acil durum mesajlaşma standardı |
| Live state | Redis | Hızlı dashboard state |
| Historical store | PostgreSQL | Güvenilir ve sorgulanabilir kalıcı veri |

## 6. Final Veri Politikası

### 6.1 Toplanacak Veriler

```text
building_id
timestamp
occupancy_count
occupancy_confidence
smoke_detected
gas_detected
temperature
building_vulnerability_index
local_alarm_level
urgency_score
priority
```

### 6.2 Toplanmayacak Veriler

```text
raw video
face image
biometric data
person identity
resident list
T.C. identity number
phone number
apartment-level personal tracking
```

### 6.3 Saklama Yaklaşımı

| Veri | Saklama |
|---|---|
| Raw video | Saklanmaz |
| Occupancy aggregate | 30-90 gün önerilir |
| Fire-gas critical events | Daha uzun audit amaçlı saklanabilir |
| Urgency score history | Raporlama ve analiz için saklanabilir |
| Building vulnerability registry | Güncel olduğu sürece |
| Audit logs | Kurum politikasına göre |

## 7. Building Vulnerability Module

Static vulnerability module MVP için structural sensor yerine geçer.

Önerilen faktörler:

| Faktör | Açıklama |
|---|---|
| Building age | Eski binalarda risk artabilir |
| Structural type | Betonarme, yığma, çelik vb. |
| Number of floors | Tahliye ve yapı davranışı için etkili |
| Adjacent-building condition | Bitişik/blok/ayrık nizam |
| Soil class / microzonation | Zemin büyütmesi riski |
| Local seismic hazard | Bölgesel deprem tehlikesi |

Önerilen formül:

```text
building_vulnerability =
0.25 * age_score
+ 0.20 * structural_type_score
+ 0.10 * floor_score
+ 0.15 * adjacency_score
+ 0.20 * soil_score
+ 0.10 * seismic_hazard_score
```

## 8. Updated Urgency Score

Final MVP urgency score:

```text
urgency_score =
0.35 * occupancy_risk
+ 0.30 * fire_gas_risk
+ 0.25 * building_vulnerability_risk
+ uncertainty_boost
```

Uncertainty boost en fazla 10-15 puan olmalıdır. Bu, eski veya düşük güvenli veri durumunda tedbirli davranmak için kullanılır.

Priority:

| Score | Priority |
|---:|---|
| 0-30 | LOW |
| 31-60 | MEDIUM |
| 61-80 | HIGH |
| 81-100 | CRITICAL |

## 9. Network ve Kesintisizlik

Edge hub bağlantı kesilse bile:

- local fire/gas alarm verebilmelidir
- son mesajları buffer'a almalıdır
- bağlantı gelince seq/timestamp ile merkeze göndermelidir
- merkez tekrar mesajları dedup etmelidir

Merkez için MVP:

```text
FastAPI + Mosquitto + Redis + PostgreSQL
```

Production için:

```text
MQTT broker redundancy
PostgreSQL backup/replication
Redis persistence
TLS/mTLS
monitoring
role-based dashboard
```

## 10. Hukuki/KVKK Sonuç

Final raporda şu pozisyon alınmalıdır:

```text
A-RES minimizes personal data risk by not transmitting or storing raw video, not performing face recognition, and only using aggregate anonymous occupancy counts. Building vulnerability data is treated as building-level technical data, not resident-level personal data. In real deployment, official data-sharing agreements, access control, signage, retention policy, and KVKK review are required.
```

Bu ifade hem güvenli hem de gerçekçidir.

## 11. Tasarıma Başlamak İçin İlk Sprint

Artık tasarım/uygulama şu sırayla ilerlemelidir:

1. `building_vulnerability.py` modülü
2. building registry schema
3. updated urgency score engine
4. simulator payload güncellemesi
5. dashboard vulnerability/alarm gösterimi
6. MQTT topic ve payload schema freeze
7. video occupancy validation

Bu sprint sonunda sistemin kalbi çalışır:

```text
building registry + real-time sensor event -> urgency score -> dashboard
```

## 12. Son Karar

Claude/Gemini raporu teknik uygulama detayları açısından güçlüdür. CODEX raporu ise hukuki/güvenlik ve temkinli akademik dil açısından daha güvenli bir çerçeve sunar. Final sistem için en doğru yaklaşım bu iki çizgiyi birleştirmektir:

```text
Claude/Gemini technical pipeline
+
CODEX cautious governance/security framing
= final A-RES design
```

Bu sentez, A-RES'i hem teknik olarak yapılabilir hem de raporda savunulabilir hale getirir.
