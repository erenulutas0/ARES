# CODEX - A-RES Son Sistem Mimarisi, Veri Politikası, Güvenlik ve Koordinasyon Raporu

## 1. Yönetici Özeti

A-RES için en uygun son mimari, **bina içi edge hub + hafif merkezi koordinasyon** mimarisidir. Bu mimaride her bina kendi gerçek zamanlı verisini toplar, ilk kontrolleri bina içindeki edge hub üzerinde yapar ve merkeze ham veri yerine özetlenmiş, doğrulanmış ve anlamlandırılmış durum mesajı gönderir. Merkezi sistem ise tüm binaları birlikte değerlendirir, urgency score üretir ve AFAD benzeri kurumlara, itfaiyeye, kurtarma ekiplerine, belediyeye ve denetim ekiplerine önceliklendirilmiş karar desteği sağlar.

Güncel sistem üç ana bilgi kaynağına dayanmalıdır:

```text
1. Occupancy sensing
2. Fire-gas sensing
3. Building vulnerability data module
```

Bu tasarımın ana fikri şudur:

```text
Real-time sensor data + static building vulnerability data
        -> building edge hub
        -> lightweight central coordination
        -> urgency score
        -> emergency authority dashboard/API
```

Bu raporun önerisi nettir: Her apartmandaki mini bilgisayarın doğrudan AFAD'a veri göndermesi teknik olarak mümkündür, ancak ana mimari olarak daha doğru olan model **edge hub -> A-RES central coordination -> AFAD-like dashboard/API** akışıdır. Edge hub hızlı yerel refleks sağlar; merkezi sistem ise çoklu bina karşılaştırması, doğrulama, veri güvenliği, kaynak dağıtımı ve kurumsal raporlama sağlar.

## 2. Güncel Sistem Tanımı

A-RES, deprem sonrası binalardan kritik durum verisi toplayan ve bu veriyi acil müdahale önceliğine dönüştüren bir karar destek sistemidir. Sistem depremi önceden tahmin etmez ve binanın kesin yapısal güvenlik teşhisini vermez. Bunun yerine, binaları risk ve müdahale önceliğine göre sıralar.

Güncel sistem bileşenleri:

| Bileşen | Görev |
|---|---|
| Occupancy sensor | Binada tahmini kaç kişi olduğunu belirler |
| Fire-gas sensor | Duman, yangın, gaz kaçağı ve sıcaklık anomalilerini algılar |
| Building vulnerability module | Bina yaşı, yapı tipi, kat sayısı, bitişik nizam ve zemin gibi statik risk faktörlerini tutar |
| Building edge hub | Sensör verilerini toplar, ilk kontrolleri yapar, local alarm tetikler, merkeze özet veri gönderir |
| Lightweight central coordination | Tüm binaları karşılaştırır, urgency score üretir, dashboard/API sağlar |
| Emergency authority interface | AFAD benzeri kurumlara, itfaiyeye, kurtarma ve belediye ekiplerine önceliklendirilmiş bilgi sunar |

## 3. Neden Edge Hub + Merkezi Koordinasyon?

### 3.1 Sadece Merkezi Sistem Neden Zayıf?

Tam merkezi mimaride sensörlerden gelen ham veri merkeze akar ve tüm kararlar merkezde verilir. Bu yaklaşımın sorunları:

- Ağ kesilirse bina içi alarm gecikebilir.
- Merkeze çok fazla ham veri gönderilir.
- Kamera ve sensör verisinin merkezi taşınması KVKK ve güvenlik riskini artırır.
- Merkez arızasında bina seviyesi refleks kaybolur.

### 3.2 Sadece Edge Hub -> AFAD Neden Yeterli Değil?

Her binanın edge hub'ının doğrudan AFAD'a veri göndermesi teknik olarak mümkündür. Ancak ana operasyon akışı olarak bu model zayıftır:

- Her bina sadece kendi durumunu bilir; diğer binalarla karşılaştırma yapamaz.
- AFAD tarafına yüzlerce/binlerce dağınık sinyal gitme riski oluşur.
- Öncelik listesi, kaynak dağıtımı ve şehir/bölge ölçeğinde koordinasyon zorlaşır.
- Her cihaz için ayrı kimlik doğrulama, güvenlik, veri standardı ve hata yönetimi gerekir.
- False alarm ve sahte cihaz saldırısı riski artar.

### 3.3 Önerilen Mimari

En dengeli mimari:

```text
Normal flow:
Building Edge Hub -> A-RES Central Coordination -> AFAD-like Dashboard/API

Emergency local flow:
Building Edge Hub -> Local alarm/siren

Fallback flow:
Building Edge Hub -> Direct emergency notification if central system is unreachable
```

Bu modelde edge hub hızlı bina seviyesi refleks üretir; merkezi sistem ise binalar arası karşılaştırma, veri doğrulama, önceliklendirme ve kurumsal paylaşım yapar.

## 4. Protokol Seçimi

### 4.1 Edge Hub -> Central Coordination

Ana protokol önerisi:

```text
MQTT v5 over TLS/mTLS
```

Neden MQTT?

- IoT için hafiftir.
- Publish/subscribe modeline uygundur.
- Sensör ve bina sayısı arttıkça ölçeklenebilir.
- QoS 1 ile mesajın en az bir kez teslim edilmesi sağlanabilir.
- Offline buffer ve tekrar gönderim stratejileriyle çalışabilir.

MQTT OASIS tarafından standartlaştırılmıştır. MQTT v5, IoT sistemleri için topic, QoS, retained messages, session handling ve reason code gibi özellikler sunar.

Önerilen topic yapısı:

```text
ares/v1/buildings/{building_id}/telemetry
ares/v1/buildings/{building_id}/occupancy
ares/v1/buildings/{building_id}/fire-gas
ares/v1/buildings/{building_id}/alarm
ares/v1/buildings/{building_id}/heartbeat
ares/v1/commands/{building_id}
```

Önerilen MQTT QoS:

| Mesaj Tipi | QoS | Gerekçe |
|---|---:|---|
| Heartbeat | 0 | Kaybolması kritik değil |
| Routine telemetry | 1 | En az bir kez teslim edilmeli |
| Fire/gas event | 1 veya 2 | Kritik olay |
| Local alarm event | 1 veya 2 | Kritik olay |
| Command/control | 1 | Tekrarlı/izlenebilir komut |

MVP için QoS 1 yeterlidir. Production senaryoda kritik alarm event'leri için QoS 2 değerlendirilebilir.

### 4.2 Central API and Dashboard

Dashboard ve kurumsal kullanıcılar için:

```text
HTTPS REST API + WebSocket/SSE
```

Kullanım:

- REST API: bina listesi, geçmiş veri, rapor export, authority integration
- WebSocket veya SSE: dashboard canlı güncellemeleri
- JWT/OAuth2 benzeri access control: kullanıcı kimliği ve rol yönetimi

### 4.3 Authority Integration

AFAD benzeri kurumlara veri aktarımı için önerilen format:

```text
Primary: HTTPS REST API with signed JSON payloads
Secondary: CAP 1.2-compatible alert messages for emergency warning interoperability
Export: CSV/PDF report for manual operation
```

CAP 1.2, OASIS tarafından tanımlanan açık bir acil durum uyarı mesajlaşma standardıdır. A-RES MVP için CAP entegrasyonu şart değildir, ancak raporda future interoperability olarak güçlü durur.

## 5. Veri Toplama Politikası

### 5.1 Occupancy Data

Toplanacak veri:

```text
building_id
timestamp
occupancy_count
entry_delta
exit_delta
confidence
camera_status
```

Toplanmayacak veri:

```text
raw video
face image
identity information
biometric template
person-level trajectory history
```

Politika:

- Görüntü bina içinde veya edge cihazda işlenir.
- Merkeze yalnızca anonim sayı verisi gönderilir.
- Video kaydı tutulmaz; test amacıyla kullanılan videolar ayrı klasörde ve kısa süreli saklanır.
- Occupancy verisi kişi bazlı değil, bina bazlı aggregate veri olarak tutulur.

### 5.2 Fire-Gas Data

Toplanacak veri:

```text
building_id
timestamp
smoke_detected
gas_detected
co_level
temperature
sensor_confidence
local_alarm_level
```

Politika:

- Bu veri kişisel veri değildir, ancak kritik altyapı/safety verisidir.
- Yanlış alarm riskine karşı eşik + tekrar okuma + confidence kullanılmalıdır.
- Kritik event'ler daha uzun saklanabilir, rutin telemetry daha kısa saklanmalıdır.

### 5.3 Building Vulnerability Data

Toplanacak veri:

```text
building_age
structural_type
floor_count
adjacency_type
soil_class
local_seismic_hazard
building_use_type
vulnerability_index
```

Kaynaklar:

- Belediye yapı ruhsatı / iskan kayıtları
- TKGM parsel sorgu ve ada/parsel eşlemesi
- İmar durumu / yapı nizamı bilgileri
- İBB bina tespit / deprem zemin kaynakları
- AFAD Türkiye Deprem Tehlike Haritası
- MTA yerbilimleri haritaları
- Zemin ve temel etüdü raporları
- MVP için manuel veya simüle edilmiş building registry

Bu verilerin tamamı her zaman açık API ile alınamayabilir. MVP için kontrollü bir senaryo dataset'i oluşturmak daha gerçekçidir. Production senaryoda belediye/kurum entegrasyonu gerekir.

## 6. Building Vulnerability Data Module

Building vulnerability module, static veya yarı-statik bina risk faktörlerini tutar. Bu modül gerçek zamanlı sensör yerine geçmez; yapısal risk için bağlamsal önceliklendirme sağlar.

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

Bu skor 0 ile 1 arasında normalize edilir.

Veri güncelleme politikası:

| Veri | Güncelleme Sıklığı |
|---|---|
| Bina yaşı | Nadiren / registry update |
| Kat sayısı | Nadiren |
| Yapı tipi | Nadiren |
| Bitişik nizam | İmar değişikliği olursa |
| Zemin/mikrobölgeleme | Resmi harita/rapor güncellemesi olursa |
| Seismic hazard | Resmi harita güncellemesi olursa |

## 7. Veri Store Etme Politikası

Veri iki ana sınıfta saklanmalıdır:

### 7.1 Live State

Amaç: dashboard ve anlık karar.

Teknoloji:

```text
Redis
```

Saklanacak veri:

```text
current occupancy
latest fire-gas state
latest alarm level
latest urgency score
device online/offline status
last update timestamp
```

Redis AOF persistence açılabilir. Redis dokümantasyonunda AOF'un write operation log mantığıyla daha dayanıklı bir seçenek olduğu belirtilir.

### 7.2 Historical Data

Amaç: raporlama, audit, test, model geliştirme.

Teknoloji:

```text
PostgreSQL
```

Tablolar:

```text
buildings
building_vulnerability_profiles
telemetry_events
occupancy_events
fire_gas_events
alarm_events
urgency_scores
authority_reports
audit_logs
```

PostgreSQL üzerinde partitioning veya time-based indexes kullanılmalıdır. Büyük ölçek için TimescaleDB veya native partitioning değerlendirilebilir.

### 7.3 Saklama Süreleri

Önerilen retention:

| Veri Tipi | Saklama Süresi |
|---|---|
| Raw video | Saklanmaz |
| Test videos | Proje/test süresi kadar, sonra silinir |
| Occupancy aggregate events | 30-90 gün |
| Fire/gas critical events | 1-5 yıl, kurum politikasına göre |
| Urgency score history | 1-5 yıl |
| Building vulnerability registry | Güncel olduğu sürece |
| Audit logs | 1-2 yıl veya kurum politikasına göre |

Bu süreler MVP için öneridir; gerçek uygulamada KVKK ve kurum politikalarıyla netleştirilmelidir.

## 8. Veri Manipülasyonu ve İşleme Pipeline'ı

Önerilen pipeline:

```text
1. Edge read
2. Edge validation
3. Local threshold check
4. Local alarm if needed
5. Message signing / authentication
6. MQTT publish
7. Broker receive
8. Central validation
9. Deduplication
10. Live state update
11. Historical event insert
12. Urgency score calculation
13. Dashboard/API notification
14. Authority report generation
```

### 8.1 Deduplication

Her mesajda şu alanlar olmalı:

```text
building_id
device_id
seq
timestamp
message_type
```

Merkez şu unique key ile tekrarları engeller:

```text
(building_id, device_id, seq)
```

### 8.2 Data Confidence

Her veri confidence ile gelmeli:

```text
sensor_confidence
occupancy_confidence
data_freshness
device_health
```

Urgency score düşük confidence durumunda tedbirli davranabilir.

## 9. Urgency Score Tasarımı

Updated scoring:

```text
urgency_score =
0.35 * occupancy_risk
+ 0.30 * fire_gas_risk
+ 0.25 * building_vulnerability_risk
+ 0.10 * uncertainty_or_staleness_boost
```

### 9.1 Occupancy Risk

Örnek:

| Occupancy | Score |
|---:|---:|
| 0 | 0 |
| 1-5 | 20 |
| 6-20 | 40 |
| 21-50 | 60 |
| 51-100 | 80 |
| 100+ | 100 |

### 9.2 Fire-Gas Risk

Örnek:

| Condition | Score |
|---|---:|
| None | 0 |
| Smoke only | 50 |
| Gas detected | 80 |
| Fire + gas / high temperature | 100 |

### 9.3 Building Vulnerability Risk

```text
building_vulnerability_index * 100
```

### 9.4 Priority Levels

| Score | Priority | Action |
|---:|---|---|
| 0-30 | LOW | Monitor |
| 31-60 | MEDIUM | Inspection when available |
| 61-80 | HIGH | Dispatch team |
| 81-100 | CRITICAL | Immediate response |

## 10. Kuruma Gönderim Modeli

Kurumlara gönderilecek veri ham veri değil, karar destek özetidir.

Örnek authority payload:

```json
{
  "incident_id": "ARES-2026-0001",
  "building_id": "B-001",
  "priority": "CRITICAL",
  "urgency_score": 91,
  "estimated_occupancy": 84,
  "fire_gas_status": "GAS_DETECTED",
  "building_vulnerability_index": 0.72,
  "recommended_response": ["rescue", "fire_department", "evacuation"],
  "last_update": "2026-05-12T14:30:00Z"
}
```

Gönderim kanalları:

```text
1. Web dashboard
2. HTTPS API
3. CAP-compatible alert message
4. CSV/PDF triage report
```

## 11. Hukuki ve KVKK Değerlendirmesi

Bu bölüm hukuki tavsiye değildir; proje tasarımı için teknik ve yönetsel risk değerlendirmesidir.

### 11.1 Occupancy Verisi

Anonim aggregate occupancy count, tek başına kişiyi belirlemiyorsa kişisel veri riski düşüktür. Ancak kamera kullanımı her zaman dikkat gerektirir. Bu nedenle:

- Raw video merkeze gönderilmemeli
- Yüz tanıma yapılmamalı
- Video kaydı tutulmamalı
- Kamera sadece giriş çizgisini görecek şekilde konumlandırılmalı
- Apartman içi özel alanları görmemeli
- Bilgilendirme levhası kullanılmalı

### 11.2 Building Vulnerability Verisi

Bina yaşı, parsel, zemin, yapı tipi gibi veriler çoğunlukla bina/taşınmaz bilgisi niteliğindedir. Ancak belirli bir kişiyle, daire sahibiyle veya adresle ilişkilendirilirse kişisel veri veya hassas güvenlik verisi riskine yaklaşabilir.

Bu nedenle:

- Kişi adı, T.C. kimlik, telefon, daire sakini listesi toplanmamalı
- Bina verisi bina ID ile tutulmalı
- Açık adres yerine gerektiğinde grid/zone seviyesi kullanılmalı
- Yetkisiz kişilere bina risk listesi açık edilmemeli
- Veri erişimi role-based olmalı

KVKK Kanunu kişisel verilerin işlenmesinde temel hak ve özgürlükleri korumayı ve veri işleyenlerin yükümlülüklerini düzenler. KVKK'nın teknik ve idari tedbir rehberi de risklere uygun güvenlik tedbirleri alınması gerektiğini vurgular.

## 12. Güvenlik Mimarisi

### 12.1 Transport Security

Öneri:

```text
MQTT over TLS 1.3
HTTPS over TLS 1.3
```

TLS 1.3 IETF RFC 8446 ile tanımlanmıştır.

### 12.2 Device Identity

Her edge hub için:

```text
unique device_id
client certificate
rotatable device token
secure provisioning
revocation list
```

Production için mTLS önerilir:

```text
edge hub certificate <-> MQTT broker certificate
```

### 12.3 Application Security

Öneriler:

- JWT/OAuth2 style access tokens for dashboard/API
- Role-based access control
- Least privilege
- Audit logs
- Admin actions logged
- Rate limiting
- Input validation with schemas

### 12.4 Database Security

Öneriler:

- PostgreSQL encryption at rest where possible
- Row-level security for multi-tenant/role restrictions
- Separate roles for read/write/admin
- Backups encrypted
- Audit trail immutable or append-only
- Secrets in environment/secret manager, not in Git

PostgreSQL Row-Level Security normal SQL privilege sistemine ek olarak satır bazlı erişim kısıtlama sağlar.

### 12.5 IoT Security Baseline

NIST IoT cybersecurity program ve OWASP IoT Security Verification Standard, IoT ekosistemlerinde cihaz kimliği, güvenli güncelleme, veri koruma, erişim kontrolü ve güvenli lifecycle gibi konuları vurgular. A-RES production tasarımında bu çerçeveler referans alınmalıdır.

## 13. Kesintisiz Çalışma ve Network Altyapısı

### 13.1 Edge-Level Resilience

Edge hub bağlantı kesildiğinde:

```text
local alarm çalışmaya devam eder
son N mesaj yerel buffer'a yazılır
bağlantı gelince flush edilir
timestamp korunur
seq ile dedup yapılır
```

### 13.2 Network Options

Önerilen bağlantılar:

| Bağlantı | Kullanım |
|---|---|
| Wired Ethernet | Sabit bina edge hub için en stabil |
| Wi-Fi | MVP ve düşük maliyetli kurulum |
| LTE/5G backup | Afet sonrası yedek bağlantı |
| LoRaWAN/NB-IoT | Düşük bant genişliği sensör durum mesajları için future option |

### 13.3 Central Availability

MVP:

```text
single laptop/server
local Mosquitto
FastAPI
PostgreSQL/SQLite
```

Pilot:

```text
cloud/VPS
managed PostgreSQL backup
Redis AOF
daily backups
monitoring
```

Production:

```text
redundant MQTT brokers
database replication
multi-zone deployment
disaster recovery plan
observability stack
```

## 14. Building Vulnerability Data'ya En Sağlıklı Ulaşım

Pratik veri stratejisi:

### MVP

- 10-20 bina için manuel/simulated registry oluştur
- Bina yaşı, kat sayısı, bitişik nizam, zemin riskini senaryo olarak gir
- AFAD/MTA/İBB kaynaklarını referans olarak göster

### Pilot

- Belediye veya kampüs bina envanteri ile çalış
- Ada/parsel ve imar bilgisi eşleştir
- Zemin/mikrobölgeleme verisini bölge düzeyinde kullan
- Bina kullanım türünü ekle

### Production

- Belediye imar/yapı ruhsat entegrasyonu
- Zemin etüdü raporu entegrasyonu
- AFAD hazard map API/harita referansı
- Kurumsal veri paylaşım protokolü

En kritik ilke:

```text
Use official data where available, simulate only for MVP, and clearly label simulated data.
```

## 15. Riskler ve Mitigasyonlar

| Risk | Mitigation |
|---|---|
| Kamera KVKK riski | Raw video yok, yüz tanıma yok, aggregate count, bilgilendirme |
| Yanlış occupancy count | confidence, manual validation, fallback unknown status |
| False fire/gas alarm | threshold + repeated reading + confidence |
| Bina vulnerability verisinin yanlışlığı | resmi kaynak önceliği, update timestamp, confidence |
| Merkez kesintisi | local alarm + edge buffer + fallback notification |
| MQTT message loss | QoS 1, seq, dedup, retry |
| Cihaz sahteciliği | mTLS, device registry, certificate revocation |
| Yetkisiz veri erişimi | RBAC, RLS, audit logs, encryption |

## 16. Önerilen Roadmap

### Week 1-2: Data Model and Protocol Freeze

- Message schemas finalize
- MQTT topics finalize
- Building registry schema finalize
- Vulnerability score formula freeze

### Week 2-3: MVP Implementation

- Edge simulator update
- Occupancy event integration
- Fire-gas event integration
- Vulnerability registry integration
- Dashboard priority view

### Week 3-4: Validation

- Doorway video test
- Fire/gas simulation test
- Vulnerability scenario test
- Latency measurement
- Data retention test

### Week 4-5: Security and Reporting

- Device ID and auth placeholder
- Role-based dashboard concept
- Audit log
- PDF/CSV triage report export
- Authority payload format

### Final

- Demo video
- Architecture diagram
- Technical report
- Financial/feasibility/risk sections

## 17. Son Karar

A-RES için önerilen son karar:

```text
Use MQTT v5 over TLS for building-to-central telemetry.
Use HTTPS REST + WebSocket/SSE for dashboard and authority interfaces.
Use edge hubs for local filtering, local alarm, buffering, and summarized reporting.
Use a lightweight central system for validation, storage, urgency scoring, ranking, and authority dashboard/API.
Use static building vulnerability data instead of real-time structural health sensors for the MVP.
Do not transmit raw video or personal identity data.
Protect all data with encryption, device identity, access control, audit logs, retention policies, and role-based access.
```

Bu mimari hem teknik olarak uygulanabilir, hem maliyet açısından gerçekçi, hem de hukuki/güvenlik riskleri daha yönetilebilir bir çözümdür.

## 18. Kaynaklar

- OASIS MQTT Version 5.0 Specification: https://docs.oasis-open.org/mqtt/mqtt/v5.0/cos02/mqtt-v5.0-cos02.html
- OGC SensorThings API Part 1: Sensing: https://docs.ogc.org/is/18-088/18-088.html
- OASIS Common Alerting Protocol v1.2: https://www.oasis-open.org/standard/cap/
- KVKK Personal Data Protection Law: https://www.kvkk.gov.tr/Icerik/6649/Personal-Data-Protection-Law
- KVKK Kişisel Veri Güvenliği Rehberi: https://www.kvkk.gov.tr/Icerik/4198/Kisisel-Veri-Guvenligi-Rehberi-%28Teknik-ve-Idari-Tedbirler%29
- AFAD Türkiye Deprem Tehlike Haritası: https://afad.gov.tr/turkiye-deprem-tehlike-haritasi
- AFAD Interaktif Deprem Tehlike Haritası: https://tdth.afad.gov.tr/
- MTA Yerbilimleri Harita Görüntüleyici: https://yerbilimleri.mta.gov.tr/
- TKGM Parsel Sorgu: https://www.tkgm.gov.tr/parsel-sorgu
- İBB Bina Tespit Uygulaması: https://binatespitiformu.ibb.gov.tr/
- NIST Cybersecurity for IoT Program: https://www.nist.gov/itl/applied-cybersecurity/nist-cybersecurity-iot-program
- OWASP IoT Security Verification Standard: https://owasp.org/www-project-iot-security-verification-standard/
- IETF TLS 1.3 RFC 8446: https://datatracker.ietf.org/doc/rfc8446/
- PostgreSQL Row Level Security Documentation: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- Redis Persistence Documentation: https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/
