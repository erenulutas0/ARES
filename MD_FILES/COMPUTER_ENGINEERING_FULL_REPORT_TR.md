# A-RES Computer Engineering Technical Report

Bu rapor, A-RES projesinde Computer Engineering ekibinin görev tanımını, tasarlanan teknik sistemi, veri kaynaklarını, model yaklaşımını, validasyon planını, sensörler arası ilişkiyi ve demo stratejisini açıklamak için hazırlanmıştır. Metin Google Docs raporuna doğrudan eklenebilir.

## 1. Computer Engineering Team Role

Computer Engineering ekibinin A-RES projesindeki temel sorumluluğu, binalardan gelen sensör ve kamera verilerini toplayan, işleyen ve acil durum önceliğine dönüştüren yazılım sistemini tasarlamaktır. Bu kapsamda ekibimiz IoT haberleşmesi, yapay zeka destekli kişi sayımı, veri analizi, urgency score hesaplama, dashboard ve optimizasyon ekibine veri sağlama konularından sorumludur.

A-RES sisteminde bilgisayar mühendisliği tarafının ana amacı şudur:

```text
Building sensor data + occupancy data + hazard data
        -> central software system
        -> urgency score
        -> emergency response priority
```

Bu nedenle bizim görevimiz yalnızca bir yapay zeka modeli çalıştırmak değildir. Asıl görevimiz, farklı kaynaklardan gelen verileri anlamlı bir karar destek sistemine dönüştürmektir.

## 2. Project Scope and Technical Positioning

A-RES bir deprem tahmin sistemi değildir. Sistem deprem olmadan önce depremin ne zaman gerçekleşeceğini tahmin etmeye çalışmaz. Ayrıca sistem, bir binanın kesin olarak güvenli veya güvensiz olduğunu söyleyen bir yapı mühendisliği teşhis sistemi olarak da tasarlanmamıştır.

Bizim teknik yaklaşımımız daha gerçekçi ve uygulanabilir bir karar destek sistemi kurmaktır. A-RES, deprem sonrası gelen verileri kullanarak hangi binanın daha acil müdahaleye ihtiyaç duyduğunu hesaplar. Bu karar; sarsıntı seviyesi, içeride tahmin edilen kişi sayısı, yangın/duman/gaz riski ve binanın kırılganlık bilgisiyle verilir.

Bu yaklaşım özellikle önemlidir çünkü afet sonrası en büyük sorunlardan biri bilgi eksikliğidir. Hangi binada kaç kişi olduğu, hangi binada yangın veya gaz kaçağı riski bulunduğu ve hangi binaların daha fazla sarsıntıya maruz kaldığı hızlıca bilinirse, kurtarma ekipleri daha doğru yönlendirilebilir.

## 3. Data Sources: Where We Get the Data

A-RES için kullanılan veriler iki gruba ayrılır:

1. Gerçek dünya referans verileri
2. MVP ve demo için üretilen simülasyon verileri

### 3.1 Earthquake Data

Deprem verileri için öncelikli kaynak USGS ComCat veri servisidir. USGS, dünya genelindeki deprem olaylarını büyüklük, derinlik, konum ve zaman bilgileriyle paylaşır. Bu veriler proje içinde deprem büyüklüğü, derinlik dağılımı ve örnek senaryo üretimi için kullanılır.

Japonya odaklı senaryo için ayrıca J-SHIS ve NIED K-NET / KiK-net gibi kaynaklar araştırılmıştır. Bu kaynaklar Japonya'nın sismik tehlike haritaları ve yer hareketi kayıtları açısından güçlü referanslardır. Ancak bu kaynaklara erişim veya format problemleri olursa MVP için USGS verisi ve simülasyon verisi yeterli olacaktır.

Kullandığımız veri kaynakları:

| Data Source | Data Type | Project Use |
|---|---|---|
| USGS ComCat | Earthquake magnitude, depth, location, time | Earthquake analysis and scenario design |
| J-SHIS | Japan seismic hazard map information | Japan-based risk context |
| NIED K-NET / KiK-net | Strong-motion acceleration records | PGA and shaking reference |
| COCO Dataset | Person class for object detection | YOLO model pre-training source |
| MOT / PETS datasets | Pedestrian tracking videos | Optional occupancy counting validation |
| Synthetic A-RES data | Simulated building states | Demo, dashboard, optimization input |

### 3.2 Building and Sensor Data

Gerçek bina sensörleri henüz kurulmadığı için MVP aşamasında bina verileri simüle edilmektedir. Her bina için şu alanlar üretilir:

| Data Field | Meaning |
|---|---|
| `building_id` | Unique building ID |
| `city` | Tokyo or Istanbul scenario |
| `building_type` | Hospital, school, residence, factory, tower |
| `occupancy` | Estimated number of people inside |
| `pga` | Peak Ground Acceleration |
| `vulnerability` | Building vulnerability proxy |
| `smoke_detected` | Smoke/fire signal |
| `gas_detected` | Gas leak signal |
| `urgency_score` | Final priority score |

Bu veriler `data/optimization_input_template.csv` dosyasında Industrial Engineering ekibinin optimizasyon modeli için örnek olarak hazırlanmıştır.

## 4. How the Sensors Detect Building Conditions

A-RES'te her bina, bir Integrated Sensor Hub ile temsil edilir. Bu sensör kutusu binanın durumunu ölçmek ve merkezi sisteme göndermek için kullanılır.

Planlanan sensörler:

| Sensor | What It Detects | Why It Matters |
|---|---|---|
| Accelerometer, e.g. MPU6050 / ADXL345 | Vibration and acceleration | Measures shaking intensity and estimates PGA |
| MQ-2 | Smoke / flammable gas | Detects fire or combustible gas risk |
| MQ-7 | Carbon monoxide | Detects dangerous gas after fire or leakage |
| DS18B20 / BME280 | Temperature, humidity, pressure | Supports fire/environment anomaly detection |
| Camera | Person movement at entrance | Estimates anonymous occupancy |

### 4.1 Accelerometer Logic

İvme sensörü binanın deprem sırasında ne kadar sarsıldığını ölçer. Buradan Peak Ground Acceleration yani PGA değeri hesaplanır. PGA değeri yükseldikçe binanın daha güçlü sarsıntıya maruz kaldığı kabul edilir.

Örneğin:

| PGA Range | Interpretation |
|---|---|
| `< 0.02g` | Normal / very low shaking |
| `0.05g - 0.10g` | Light to moderate shaking |
| `0.20g - 0.35g` | Strong shaking |
| `> 0.50g` | Severe shaking |

Bu değer tek başına “bina yıkıldı” anlamına gelmez. Ancak yüksek PGA, yüksek vulnerability ve yüksek occupancy ile birleşirse acil müdahale önceliği artar.

### 4.2 Smoke, Fire and Gas Logic

Duman ve gaz sensörleri deprem sonrası ikincil tehlikeleri algılamak için kullanılır. Depremden sonra yangın, gaz kaçağı veya karbonmonoksit riski oluşabilir. Bu riskler bina yapısal olarak tamamen yıkılmasa bile acil müdahale gerektirebilir.

Bu nedenle urgency score içinde smoke/fire ve gas verilerine ayrı ağırlık verilmiştir. Örneğin orta şiddette sarsıntı alan ama içinde çok kişi bulunan ve gaz kaçağı tespit edilen bir bina, sadece sarsıntı değerine göre değil, toplam risk durumuna göre önceliklendirilir.

### 4.3 Occupancy Detection Logic

Binadaki kişi sayısını tahmin etmek için kapı girişinden geçen insanlar sayılır. Bunun için kamera görüntüsü üzerinde YOLO11n ile insan tespiti yapılır, ByteTrack ile kişi takibi yapılır ve sanal çizgi geçişi hesaplanır.

Sistem şu mantıkla çalışır:

```text
Person detected -> Track ID assigned -> Person crosses virtual line
        -> Entry or exit event
        -> Current occupancy updated
```

Yüz tanıma veya kimlik tespiti yapılmaz. Sadece kaç kişinin içeri girdiği veya dışarı çıktığı sayılır.

## 5. Sensor Fusion: How Sensor Relationships Are Built

A-RES'in en önemli taraflarından biri tek bir sensöre bağlı kalmamasıdır. Farklı sensörlerden gelen bilgiler birleştirilerek daha anlamlı bir risk değerlendirmesi yapılır. Buna sensor fusion yaklaşımı denebilir.

Örneğin:

| Scenario | Interpretation |
|---|---|
| High PGA + high occupancy | Many people may be at risk after strong shaking |
| Medium PGA + gas detected | Secondary hazard increases urgency |
| Low PGA + fire detected | Fire response may still be needed |
| High PGA + old building + many occupants | Rescue priority becomes high |
| Missing/stale data | Confidence decreases and score may be boosted cautiously |

Bu ilişkiler rule-based urgency score formülü ile kurulmuştur. MVP aşamasında bu yaklaşım ML modelinden daha uygundur çünkü kararın nedeni açıklanabilir. Örneğin bir bina CRITICAL olduysa, bunun nedeni dashboard üzerinde PGA, occupancy, fire/gas ve vulnerability değerleriyle gösterilebilir.

## 6. Urgency Score Calculation

Urgency score 0 ile 100 arasında hesaplanır. Bu skor emergency response ekiplerinin hangi binaya önce gitmesi gerektiğini gösterir.

Formülde kullanılan bileşenler:

| Component | Weight |
|---|---:|
| Shaking severity / PGA | 30% |
| Occupancy | 25% |
| Fire / smoke | 20% |
| Building vulnerability | 15% |
| Gas leak | 10% |

Priority seviyeleri:

| Score Range | Priority |
|---|---|
| 0-30 | LOW |
| 31-60 | MEDIUM |
| 61-80 | HIGH |
| 81-100 | CRITICAL |

Bu skor, binayı kesin olarak güvenli/güvensiz ilan etmez. Sadece sınırlı kaynakların daha mantıklı dağıtılmasına yardımcı olur.

## 7. AI / ML Strategy: How We Train or Use Models

Projede iki farklı yapay zeka yaklaşımı vardır:

1. Computer vision model for occupancy estimation
2. Optional ML model for urgency score approximation

### 7.1 Occupancy Counting Model

Kişi sayımı için YOLO11n modeli kullanılmaktadır. YOLO11n zaten COCO veri seti üzerinde eğitilmiş bir object detection modelidir. COCO veri setinde `person` sınıfı bulunduğu için MVP aşamasında kendi modelimizi sıfırdan eğitmemize gerek yoktur.

Bu bizim için önemli bir karardır çünkü sıfırdan model eğitmek için çok sayıda etiketli görüntü, GPU kaynağı ve zaman gerekir. Proje süresi içinde en doğru yaklaşım, hazır ve güvenilir bir modeli alıp A-RES kullanım senaryosuna entegre etmektir.

Kullandığımız yaklaşım:

```text
Pre-trained YOLO11n model
        -> detect person class
        -> ByteTrack tracking
        -> virtual line crossing
        -> entry/exit count
```

### 7.2 Do We Train a New Model?

MVP için yeni bir computer vision modeli eğitmiyoruz. Bunun yerine pre-trained YOLO11n kullanıyoruz. Eğer ileride doğruluk yetersiz kalırsa, CrowdHuman, MOT17/MOT20 veya kendi kapı videolarımızla fine-tuning yapılabilir.

Urgency score tarafında ise ML modeli opsiyoneldir. Şu an ana karar mekanizması rule-based formüldür. Ancak synthetic dataset ile Random Forest veya başka bir tabular model eğitilerek rule-based skoru taklit eden veya karşılaştıran bir AI score üretilebilir.

Bu durumda eğitim verisi şu şekilde oluşturulur:

1. Farklı bina senaryoları simüle edilir.
2. Her senaryoda PGA, occupancy, vulnerability, smoke, gas gibi özellikler üretilir.
3. Rule-based urgency score hesaplanır.
4. ML modeli bu girdilerden skoru tahmin etmeyi öğrenir.
5. ML sonucu rule-based skorla karşılaştırılır.

Ancak raporda ana iddia şu olmalıdır: A-RES'in MVP karar mekanizması açıklanabilir rule-based scoring sistemidir; ML destekleyici veya gelecek geliştirme olarak kullanılabilir.

## 8. Validation: How We Validate the System

Sistemi üç seviyede validate etmeyi planlıyoruz:

1. Unit tests
2. Integration tests
3. Real video / manual count validation

### 8.1 Unit Tests

Unit testler urgency score fonksiyonunun beklenen davranışı verip vermediğini kontrol eder. Örneğin:

| Test Scenario | Expected Result |
|---|---|
| Empty safe building | LOW priority |
| High PGA + high occupancy + fire/gas | CRITICAL priority |
| Old/stale data | Score should increase cautiously |

Bu testler GitHub Actions CI içinde otomatik çalışacak şekilde hazırlanmıştır.

### 8.2 Integration Tests

Integration testte sensör ve occupancy payload'ları birlikte düşünülür. Amaç, kamera ve sensör verisi geldiğinde sistemin bina state'ini oluşturup doğru urgency score üretebildiğini kontrol etmektir.

Örnek akış:

```text
Sensor payload arrives
Occupancy payload arrives
Server combines latest state
Urgency score is calculated
Dashboard receives updated priority
```

### 8.3 Occupancy Validation with Phone Videos

Kişi sayımı için en önemli validasyon gerçek video ile yapılacaktır. Telefon kapı girişine sabitlenecek ve kısa videolar çekilecektir.

Test senaryoları:

| Test | Description |
|---|---|
| Single entry | One person enters |
| Single exit | One person exits |
| Two people | Two people pass close together |
| Turn back | Person approaches and turns back |
| Empty frame | No false count should happen |

Her video için manuel sayım yapılacak ve sistem çıktısı ile karşılaştırılacaktır.

Örnek tablo:

| Video | Manual Count | System Count | Error |
|---|---:|---:|---:|
| entry_01.mp4 | +1 | +1 | 0 |
| exit_01.mp4 | -1 | -1 | 0 |
| two_people.mp4 | +2 | +2 or +1 | 0 or 1 |

Bu tablo final raporda sistemin ne kadar doğru çalıştığını gösterecektir.

## 9. Demo Strategy: Phone Camera vs Laptop Processing

Başta kamera entegrasyonunu mobil uygulama üzerinden düşünmüştük. Yani telefonu kapıya koyup mobil uygulamada kamerayı açarak kişi sayımı yapma fikri vardı. Ancak teknik değerlendirme sonunda MVP için daha güvenilir bir karar verdik.

Yeni demo yaklaşımı:

```text
Phone records doorway video
        -> laptop runs YOLO11n + ByteTrack
        -> laptop publishes MQTT occupancy event
        -> FastAPI server receives data
        -> dashboard updates building priority
```

Bu değişikliğin nedenleri:

1. Mobil cihazda YOLO çalıştırmak daha fazla entegrasyon riski taşır.
2. Flutter içinde gerçek zamanlı camera + ML pipeline kurmak proje süresini aşabilir.
3. Laptop üzerinde modeli çalıştırmak daha kolay debug edilir.
4. Demo için aynı teknik fikri daha stabil şekilde kanıtlar.
5. Gelecekte laptop yerine Raspberry Pi, Jetson Nano veya mini PC kullanılabilir.

Bu yüzden mobil uygulama MVP'de acil durum dashboard'u olarak konumlandırılacaktır. Kamera işleme ise edge device mantığıyla laptop üzerinde gösterilecektir.

## 10. Communication Design: MQTT and Central Server

Sensörler ve kamera sistemi merkezi sunucuya MQTT ile veri gönderir. MQTT seçilmesinin nedeni IoT sistemlerinde hafif, hızlı ve publish/subscribe mantığına uygun olmasıdır.

Örnek occupancy mesajı:

```json
{
  "building_id": "JP-001",
  "camera_id": "CAM-001",
  "timestamp": "2026-05-10T12:00:00Z",
  "seq": 15,
  "event_type": "count_delta",
  "delta": 1,
  "direction": "ENTRY",
  "current_count": 47,
  "confidence": 0.95
}
```

Örnek sensor mesajı:

```json
{
  "building_id": "JP-001",
  "hub_id": "HUB-001",
  "timestamp": "2026-05-10T12:00:00Z",
  "seq": 42,
  "pga": 0.32,
  "smoke_detected": false,
  "gas_detected": true,
  "vulnerability": 0.4
}
```

FastAPI sunucusu bu mesajları alır, bina state'ini günceller, urgency score hesaplar ve dashboard'a gönderir.

## 11. Data for Optimization Team

Industrial Engineering ekibinin görevi, sınırlı kaynakların hangi binaya atanacağını optimize etmektir. Bunun için Computer Engineering ekibi olarak bir input dataset hazırladık.

Dosya:

```text
data/optimization_input_template.csv
```

Bu dosyada hem Tokyo hem İstanbul senaryosundan örnek binalar bulunmaktadır. Her bina için urgency score, priority, required rescue units, required fire units, required medical units ve accessibility score gibi kolonlar vardır.

IE ekibi bu veriyi kullanarak şu tarz bir model kurabilir:

```text
Minimize total weighted response time
Subject to limited rescue/fire/medical team availability
Prioritize high urgency buildings first
```

Bu sayede A-RES yalnızca veri gösteren bir sistem değil, aynı zamanda kaynak dağıtımı için kullanılabilecek bir karar destek altyapısı haline gelir.

## 12. GitHub and CI/CD Work

Proje GitHub'a yüklenmiştir ve repository içinde README, teknik dokümantasyon, dashboard, backend, edge scripts, testler ve örnek veri dosyaları bulunmaktadır.

CI/CD tarafında hafif bir GitHub Actions workflow eklenmiştir. Bu workflow her push veya pull request sonrasında testleri çalıştırır.

Test edilen ana noktalar:

1. Urgency score doğru priority üretiyor mu?
2. Kritik senaryo CRITICAL seviyesine çıkıyor mu?
3. Eski/düşük güvenli veri score'u tedbir amaçlı artırıyor mu?
4. Optimization CSV dosyası doğru kolonlara ve geçerli değer aralıklarına sahip mi?

YOLO modeli CI içinde çalıştırılmamıştır çünkü bu ağır bir bağımlılıktır ve GitHub Actions üzerinde gereksiz yavaş/kırılgan olabilir. YOLO doğrulaması gerçek video testleriyle yapılacaktır.

## 13. Current Deliverables

Computer Engineering ekibi tarafından hazırlanan ana çıktılar:

| Deliverable | File |
|---|---|
| GitHub README | `README.md` |
| System architecture | `MD_FILES/ARCHITECTURE.md` |
| Occupancy system design | `MD_FILES/OCCUPANCY_SYSTEM.md` |
| ML strategy | `MD_FILES/ML_STRATEGY.md` |
| Urgency score design | `MD_FILES/URGENCY_SCORE.md` |
| GitHub repository selection | `MD_FILES/GITHUB_REPOSITORY_SELECTION.md` |
| Optimization data package | `MD_FILES/OPTIMIZATION_DATA_PACKAGE.md` |
| Google Docs report text | `MD_FILES/GOOGLE_DOCS_CE_WEEK_REPORT_TR.md` |
| Full CE technical report | `MD_FILES/COMPUTER_ENGINEERING_FULL_REPORT_TR.md` |
| Optimization sample data | `data/optimization_input_template.csv` |
| Edge occupancy counter | `src/edge/occupancy_counter.py` |
| Simulation script | `src/edge/simulator.py` |
| Urgency engine | `src/server/urgency_engine.py` |
| CI tests | `tests/` |

## 14. Next Steps

Sonraki hafta için Computer Engineering tarafında yapılması gerekenler:

1. Telefon kamerası ile kapı giriş/çıkış videoları çekmek.
2. YOLO + ByteTrack çıktısını manuel sayım ile karşılaştırmak.
3. Dashboard üzerinde gerçek test çıktısını göstermek.
4. MQTT -> FastAPI -> dashboard uçtan uca demo videosu kaydetmek.
5. IE ekibiyle optimization CSV formatını netleştirmek.
6. Rapor içinde financial/economic/feasibility analysis bölümlerine teknik maliyet ve uygulanabilirlik bilgisi vermek.

## 15. Summary

Bu hafta Computer Engineering ekibi olarak A-RES'in yazılım ve veri altyapısını somutlaştırdık. Sensörlerden ve kamera sisteminden gelen verilerin nasıl toplanacağını, nasıl işleneceğini, nasıl urgency score'a dönüştürüleceğini ve dashboard/optimization tarafına nasıl aktarılacağını tasarladık.

En önemli teknik kararlarımız şunlardır:

- Deprem tahmini iddiası yerine deprem sonrası acil müdahale önceliklendirme yapılacaktır.
- Occupancy estimation için pre-trained YOLO11n + ByteTrack kullanılacaktır.
- Telefon kamerası doğrudan mobil ML cihazı olarak değil, video/test kaynağı olarak kullanılacaktır.
- Model işleme MVP'de laptop üzerinde yapılacaktır.
- Sensör verileri MQTT ile merkezi FastAPI sunucuya gönderilecektir.
- Urgency score açıklanabilir rule-based formülle hesaplanacaktır.
- IE ekibine optimization-ready CSV verisi sağlanacaktır.
- GitHub üzerinde README, CI testleri ve teknik dokümantasyon hazırlanmıştır.

Bu çalışmalar, A-RES'in sadece konsept olarak değil, test edilebilir bir MVP sistemi olarak ilerlediğini göstermektedir.
