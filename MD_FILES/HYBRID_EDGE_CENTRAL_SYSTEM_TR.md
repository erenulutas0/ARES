# A-RES Hybrid Edge and Central Command System

## Sistem Fikri

A-RES sisteminde her bina kendi sensörlerinden veri toplar, bu verileri yerel bir edge hub üzerinde işler ve merkezi komuta makinesine gönderir. Merkezi sistem, tüm binalardan gelen verileri birleştirerek acil müdahale önceliğini hesaplar. Ancak bina içindeki kritik alarm kararları tamamen merkeze bırakılmaz. Çünkü deprem anında internet kesintisi, ağ gecikmesi veya merkezle bağlantı kaybı yaşanabilir.

Bu nedenle A-RES için en sağlam mimari **hybrid edge + central command** yaklaşımıdır.

```text
Local edge hub = fast building-level reaction
Central command machine = multi-building coordination and prioritization
```

## Neden Sadece Merkezi Sistem Yeterli Değil?

Sadece merkezi sistem kullanılırsa bina sensörlerinden gelen veri önce merkeze gider, merkez değerlendirir ve daha sonra binadaki alarm sistemine geri komut gönderir. Bu yapı normal şartlarda çalışabilir, fakat deprem gibi kritik bir olayda bağlantı gecikmesi veya internet kesintisi riski vardır.

Bu yüzden bina içindeki sensör hub bazı kritik durumlarda merkezi beklemeden alarm tetikleyebilmelidir. Örneğin çok yüksek sarsıntı, duman, gaz kaçağı veya ani sıcaklık artışı algılanırsa bina içindeki siren, ışıklı uyarı veya mobil uyarı yerel olarak çalıştırılabilir.

Merkezi sistem ise tüm binaları birlikte değerlendirir ve kurtarma ekiplerinin hangi binaya önce gitmesi gerektiğini belirler.

## Genel Mimari

```text
[Building A Sensor Hub] ----\
[Building B Sensor Hub] ----- MQTT ----> [Central Command Machine] ----> [Dashboard]
[Building C Sensor Hub] ----/                    |
                                                  v
                                      [Emergency Resource Priority]
```

Her bina kendi içinde şu bileşenlere sahiptir:

| Component | Purpose |
|---|---|
| Accelerometer / IMU | Binanın sarsıntı seviyesini ölçer |
| Smoke / gas sensors | Duman, yangın veya gaz kaçağı riskini algılar |
| Temperature / environmental sensors | Yangın veya çevresel anomaliyi destekler |
| Entrance camera counter | Bina içindeki tahmini kişi sayısını hesaplar |
| Local edge hub | Sensör verilerini toplar, ön kontrol yapar ve MQTT ile merkeze gönderir |
| Local alarm output | Kritik durumda bina içindeki alarmı tetikler |

## Veri Akışı

Sistem iki paralel karar akışıyla çalışır.

### 1. Local Building-Level Reaction

Bu akış binanın kendi içinde hızlı tepki vermesini sağlar.

```text
Accelerometer / smoke / gas sensor
        -> local edge hub
        -> immediate danger check
        -> local siren / light / warning trigger
```

Örnek:

```text
If PGA > critical threshold OR gas_detected = true:
        trigger local alarm
```

Bu karar için merkezin cevabını beklemek gerekmez.

### 2. Central Command Evaluation

Bu akış tüm binaların birlikte değerlendirilmesini sağlar.

```text
Sensor data + occupancy data
        -> MQTT
        -> central FastAPI server
        -> sensor fusion
        -> urgency score
        -> dashboard and emergency team priority
```

Merkezi sistem şu sorulara cevap verir:

- Hangi bina daha fazla sarsıldı?
- Hangi binada daha fazla insan olabilir?
- Hangi binada yangın, duman veya gaz riski var?
- Hangi bina daha kırılgan?
- Kurtarma ekipleri önce nereye gitmeli?

## Kamera ile Kişi Sayımı

Kapı girişlerine yerleştirilen kamera sistemi binadaki kişi sayısını tahmin etmek için kullanılır. Sistem yüz tanıma veya kimlik tespiti yapmaz. Sadece giriş ve çıkış hareketlerini sayar.

Kamera işleme akışı:

```text
Entrance video
        -> YOLO11n person detection
        -> ByteTrack person tracking
        -> virtual line crossing
        -> entry / exit count
        -> current occupancy
        -> MQTT message to central machine
```

Örneğin:

```text
Person enters  -> delta = +1
Person exits   -> delta = -1
```

Bu veri deprem sonrası çok önemlidir. Çünkü aynı sarsıntı seviyesine sahip iki binadan, içinde daha fazla insan olan bina daha yüksek öncelik almalıdır.

## Telefon Yerine Laptop Üzerinden Görüntü İşleme Kararı

Başlangıçta telefonun mobil uygulama içinde kamerayı açıp doğrudan kişi sayımı yapması düşünülmüştü. Ancak MVP için bu yaklaşım teknik olarak daha risklidir. Flutter içinde gerçek zamanlı kamera, YOLO modeli ve tracking pipeline kurmak zaman alır ve demo sırasında hata çıkarma ihtimali yüksektir.

Bu nedenle daha güvenilir MVP yaklaşımı seçilmiştir:

```text
Phone records doorway video
        -> laptop runs YOLO11n + ByteTrack
        -> laptop publishes occupancy event via MQTT
        -> central server receives data
        -> dashboard updates building occupancy and urgency score
```

Bu yaklaşımda telefon tamamen devreden çıkmaz. Telefon kamera/video kaynağı olarak kullanılır. Yapay zeka işlemi ise laptop üzerinde yapılır. Gerçek sistemde laptopun yerini Raspberry Pi, Jetson Nano veya mini PC gibi edge cihazlar alabilir.

## Sensörler Arası İlişki

A-RES tek bir sensöre göre karar vermez. Farklı sensörlerden gelen veriler birlikte değerlendirilir.

| Sensor Combination | Interpretation |
|---|---|
| High PGA + high occupancy | Çok sayıda insan güçlü sarsıntı sonrası risk altında olabilir |
| Medium PGA + gas detected | Gaz kaçağı nedeniyle aciliyet artar |
| Low PGA + smoke detected | Deprem az olsa bile yangın riski müdahale gerektirebilir |
| High PGA + old building | Kırılgan bina daha yüksek öncelik alır |
| Stale data + previous high risk | Veri eskiyse sistem tedbirli davranır |

Bu birleşik değerlendirme sonucunda merkezi sistem her bina için urgency score hesaplar.

## Sonuç

Bu tasarım mantıklıdır ve A-RES için güçlü bir sistem mimarisi oluşturur. En doğru anlatım şudur:

> Local sensor hubs detect immediate dangerous conditions and can trigger local building alarms, while the central command system collects data from all buildings, calculates urgency scores, and coordinates emergency response.

Bu yapı hem hızlı bina içi alarm üretir hem de merkezi afet koordinasyonu sağlar.
