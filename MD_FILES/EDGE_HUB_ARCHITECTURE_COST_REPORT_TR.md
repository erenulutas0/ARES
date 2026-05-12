# A-RES Edge Hub Mimarisi, Roadmap ve Tahmini Maliyet Raporu

## 1. Güncel Tasarım Kararı

Ekip tartışmasından sonra A-RES mimarisi daha gerçekçi bir yöne evrilmiştir. İlk fikirde tüm sensörlerin veriyi merkezi bir veri merkezine göndermesi ve tüm kararların merkezde verilmesi düşünülüyordu. Ancak bunun maliyet, ağ bağımlılığı ve gecikme açısından riskli olabileceği görüldü.

Bu nedenle en mantıklı çözüm, tamamen merkezi bir sistem yerine **bina içi edge hub + hafif merkezi koordinasyon** mimarisidir.

Kısaca sistem şu şekilde çalışır:

```text
Occupancy sensor + fire/gas sensor + structural health sensor
        -> building edge hub
        -> local risk evaluation and local alarm decision
        -> summarized status sent to central coordination system
        -> AFAD-like emergency dashboard and resource prioritization
```

Bu yaklaşımda her sensör ayrı ayrı AFAD'a veri göndermez. Bunun yerine sensörler bina içindeki edge hub'a bağlanır. Edge hub veriyi toplar, ilk değerlendirmeyi yapar ve sadece anlamlı özet bilgiyi merkeze gönderir. Merkez ise tüm binaları birlikte karşılaştırır ve acil müdahale önceliğini oluşturur.

## 2. Neden Hibrit Mimari Daha Mantıklı?

Üç farklı seçenek değerlendirilebilir:

| Option | Description | Evaluation |
|---|---|---|
| Fully centralized | Tüm ham veri merkeze gider, tüm karar merkezde verilir | Veri trafiği ve merkez maliyeti artar; bağlantı kesilirse bina alarmı gecikebilir |
| Fully decentralized | Her bina/sensör kendi kararını verir ve doğrudan AFAD'a gönderir | Merkezi önceliklendirme zayıflar; AFAD tarafında veri karmaşası oluşabilir |
| Hybrid edge + central | Bina içinde ön değerlendirme yapılır, merkez tüm binaları koordine eder | En dengeli, maliyet-etkin ve savunulabilir çözüm |

Bu yüzden önerilen A-RES mimarisi:

> Each building has a local edge hub that collects and evaluates sensor data locally. The central coordination system receives summarized building risk status and ranks all buildings for emergency response.

## 3. Üç Ana Sensör Grubu

Ekip tarafından belirlenen üç sensör grubu proje için iyi bir sadeleştirmedir. Bu sayede sistem hem anlaşılır hem de uygulanabilir hale gelir.

### 3.1 Occupancy Sensor

Occupancy sensor, bina içindeki tahmini kişi sayısını belirlemek için kullanılır. MVP'de bu görev giriş kamerası ve görüntü işleme ile yapılır.

Akış:

```text
Entrance camera video
        -> YOLO11n person detection
        -> ByteTrack tracking
        -> virtual line crossing
        -> current occupancy count
```

Bu sistem yüz tanıma yapmaz. Sadece kaç kişinin içeri girdiği ve kaç kişinin çıktığı sayılır. Deprem sonrası bu veri çok değerlidir çünkü acil müdahale önceliğinde içerideki tahmini insan sayısı çok güçlü bir faktördür.

### 3.2 Fire-Gas Sensor

Fire-gas sensor grubu, deprem sonrası oluşabilecek ikincil tehlikeleri algılamak için kullanılır.

Kullanılabilecek sensörler:

| Sensor | Purpose |
|---|---|
| MQ-2 | Smoke and flammable gas detection |
| MQ-7 | Carbon monoxide detection |
| BME280 / DS18B20 | Temperature and environmental anomaly support |

Bu sensörler yangın, duman, gaz kaçağı veya sıcaklık artışı gibi durumlarda edge hub'a alarm sinyali üretir. Bu veri hem local alarm hem de merkezi urgency score için kullanılır.

### 3.3 Structural Health Sensor

Kolonlara yerleştirilecek sağlamlık sensörü, binanın depremden sonra yapısal risk seviyesini tahmin etmek için kullanılır. Burada dikkatli bir dil kullanmak gerekir: sistem kolonun kesin olarak sağlam veya kırık olduğunu söylemez. Bunun yerine **structural risk indicator** üretir.

Kullanılabilecek sensör yaklaşımları:

| Sensor Type | What It Measures |
|---|---|
| Accelerometer / IMU | Vibration, shaking, abnormal movement |
| Strain gauge | Local deformation / strain on structural elements |
| Displacement / tilt sensor | Permanent movement or tilt after shaking |

Rapor diliyle doğru ifade:

> The structural health sensor does not provide a final engineering diagnosis. It provides a structural risk indicator for prioritizing inspection and rescue operations.

Bu ifade projeyi daha bilimsel ve savunulabilir hale getirir.

## 4. Edge Hub Ne Yapar?

Edge hub, binanın yerel beyni gibi çalışır. Her sensörün içine ayrı mini bilgisayar koymak yerine, sensörlerin bağlı olduğu tek bir bina içi edge hub kullanmak daha mantıklıdır.

Edge hub'ın görevleri:

1. Occupancy, fire-gas ve structural sensor verilerini toplar.
2. Basit filtreleme ve eşik kontrolü yapar.
3. Yerel alarm kararını verir.
4. Veriyi özetleyerek merkeze gönderir.
5. Ağ kesintisi olursa kısa süreli buffer tutabilir.
6. Merkeze MQTT veya HTTP ile building status mesajı yollar.

Örnek edge hub çıktısı:

```json
{
  "building_id": "B-001",
  "occupancy": 42,
  "fire_gas_risk": true,
  "structural_risk": "HIGH",
  "local_alarm": "CRITICAL",
  "local_risk_score": 88,
  "timestamp": "2026-05-12T14:30:00Z"
}
```

Bu yapı merkeze ham veri yerine daha anlamlı ve daha küçük veri gönderir.

## 5. Merkezi Sistem Hala Gerekli mi?

Evet, merkezi sistem tamamen kaldırılmamalıdır. Ancak bu merkez pahalı bir data center olmak zorunda değildir. MVP için bir laptop, üniversite sunucusu veya küçük bir cloud/VPS yeterlidir.

Merkezi sistemin görevi:

- Tüm binalardan gelen özet risk verilerini toplamak
- Binaları urgency score'a göre sıralamak
- AFAD benzeri kurumlara dashboard/API sağlamak
- Kurtarma, itfaiye ve sağlık ekipleri için öncelik listesi oluşturmak
- Industrial Engineering optimizasyon modeline veri sağlamak

Önemli nokta: Edge hub lokal hızlı karar verir, merkez ise şehir/bölge ölçeğinde koordinasyon yapar.

## 6. Önerilen Sistem Mimarisi

```text
[Occupancy Sensor]
[Fire-Gas Sensor]
[Structural Health Sensor]
          |
          v
[Building Edge Hub]
  - local filtering
  - local alarm decision
  - local risk score
  - data buffering
  - MQTT/HTTP transmission
          |
          v
[Central Coordination System]
  - receives summarized building status
  - ranks buildings by urgency
  - dashboard/API for AFAD-like users
  - supports resource allocation
          |
          v
[Emergency Response Teams]
```

## 7. Roadmap

### Phase 1: MVP Demo

Amaç, sistemi yazılım ve simülasyon düzeyinde çalışır göstermek.

| Task | Output |
|---|---|
| Simulated building sensor data | JSON/MQTT building status messages |
| Occupancy video test | Manual count vs system count table |
| Local alarm logic | NORMAL / WARNING / CRITICAL decision |
| FastAPI central server | Receives building data and computes priority |
| Web dashboard | Shows risk score, local alarm, occupancy, hazards |
| Demo video | End-to-end walkthrough |

### Phase 2: Single-Building Prototype

Amaç, bir bina veya oda girişinde gerçek sensör/kamera ile küçük prototip kurmak.

| Task | Output |
|---|---|
| Fire-gas sensor test | Smoke/gas threshold event |
| IMU/accelerometer test | Shaking event simulation |
| Camera occupancy test | Entrance count validation |
| Edge hub integration | Raspberry Pi / mini PC based hub |
| Local alarm output | LED/siren/buzzer trigger |

### Phase 3: Multi-Building Simulation

Amaç, farklı binalardan gelen verileri merkezi sistemde karşılaştırmak.

| Task | Output |
|---|---|
| 5-10 building simulation | Tokyo/Istanbul scenario |
| Central priority ranking | Urgency sorted list |
| Resource allocation data | CSV for Industrial Engineering |
| Latency measurement | MQTT-to-dashboard timing |

### Phase 4: Future Real Deployment

Amaç, sistemi gerçek dünyaya daha yakın hale getirmek.

| Task | Output |
|---|---|
| More robust edge hardware | Industrial enclosure and power backup |
| Better structural monitoring | Strain/displacement calibration |
| Secure communication | TLS, device authentication |
| AFAD integration concept | API-based emergency data sharing |

## 8. Tahmini Maliyet Varsayımları

Bu maliyetler akademik prototip içindir. Gerçek fiyatlar tedarikçiye, döviz kuruna, kaliteye, vergiye ve stok durumuna göre değişir.

Bu raporda yaklaşık kur:

```text
1 USD ≈ 45.4 TRY
```

### 8.1 MVP Maliyeti

MVP'de laptop mevcut kabul edilir. Bu yüzden ana maliyet sensör ve küçük elektronik bileşenlerdir.

| Item | Estimated USD | Estimated TRY |
|---|---:|---:|
| ESP32 development board | 5-10 | 227-454 |
| MQ-2 smoke/gas sensor | 2-5 | 91-227 |
| MQ-7 carbon monoxide sensor | 3-8 | 136-363 |
| MPU6050 / ADXL345 accelerometer | 2-7 | 91-318 |
| BME280 / DS18B20 temperature sensor | 2-6 | 91-272 |
| Buzzer / LED / relay local alarm | 5-15 | 227-681 |
| Breadboard, cables, resistors | 10-20 | 454-908 |
| Basic enclosure | 10-25 | 454-1,135 |
| Phone camera / existing laptop | 0 | 0 |

Estimated MVP total:

```text
39-96 USD ≈ 1,771-4,358 TRY
```

Bu seviye rapor ve sınıf demosu için yeterlidir.

### 8.2 Single-Building Edge Hub Prototype

Bu senaryoda her bina için Raspberry Pi veya benzeri bir mini bilgisayar edge hub olarak kullanılır.

| Item | Estimated USD | Estimated TRY |
|---|---:|---:|
| Raspberry Pi 5 4GB board | 60 | 2,724 |
| Power supply, case, cooler, microSD | 35-45 | 1,589-2,043 |
| Raspberry Pi Camera Module 3 / USB camera | 27-45 | 1,226-2,043 |
| ESP32 sensor board | 5-10 | 227-454 |
| Fire-gas sensor group | 7-18 | 318-817 |
| Structural sensor group for columns | 20-80 | 908-3,632 |
| Local alarm output | 10-25 | 454-1,135 |
| Enclosure and wiring | 20-50 | 908-2,270 |
| Small UPS / backup power option | 25-60 | 1,135-2,724 |

Estimated single-building prototype total:

```text
209-393 USD ≈ 9,489-17,842 TRY
```

### 8.3 More Robust Prototype

Eğer kamera işlemi daha güçlü donanım isterse Jetson Nano, mini PC veya daha güçlü edge cihaz gerekebilir.

| Item | Estimated USD | Estimated TRY |
|---|---:|---:|
| Mini PC / Jetson-class edge device | 150-350 | 6,810-15,890 |
| Camera and sensors | 60-150 | 2,724-6,810 |
| Enclosure, alarm, power backup | 60-150 | 2,724-6,810 |
| Installation and wiring allowance | 50-150 | 2,270-6,810 |

Estimated robust prototype total:

```text
320-800 USD ≈ 14,528-36,320 TRY per building
```

### 8.4 Central Coordination Cost

Merkezi sistem için pahalı bir data center gerekmez.

| Option | Estimated Cost |
|---|---:|
| Existing laptop for demo | 0 TRY |
| University/local server | 0-2,000 TRY setup allowance |
| Small VPS/cloud server | 5-20 USD/month ≈ 227-908 TRY/month |
| Production-grade secure cloud | Future scope |

Bu nedenle merkezi sistemi tamamen kaldırmak yerine hafif ve ucuz bir koordinasyon sunucusu olarak konumlandırmak daha doğrudur.

## 9. Önerilen Nihai Karar

Proje raporunda mimari şu şekilde açıklanmalıdır:

> A-RES uses a hybrid edge-central architecture. Each building has a local edge hub that collects data from occupancy, fire-gas, and structural health sensors. The edge hub performs local filtering, detects critical conditions, and can trigger local alarms immediately. It sends summarized building risk data to a lightweight central coordination system. The central system ranks all buildings by urgency and supports AFAD-like emergency response coordination.

Bu karar hem arkadaşınızın edge processing fikrini içerir hem de merkezi koordinasyonun faydasını kaybetmez.

## 10. Görsel İçin Gemini / Codex Prompt

```text
Create a clean professional engineering diagram for a system called "A-RES: Edge-Based Smart Building Emergency Response System".

Show three smart buildings on the left. Inside each building, show three sensor groups:
1. Occupancy Sensor / Entrance Camera
2. Fire-Gas Sensor
3. Structural Health Sensor on columns

Connect these sensors to a "Building Edge Hub" inside each building. The edge hub should include labels:
- local data collection
- local risk evaluation
- local alarm trigger
- MQTT/HTTP transmission

Show a local siren/alarm connected directly to the edge hub to explain that critical alarms can be triggered without waiting for the central server.

From each building edge hub, draw arrows to a lightweight "Central Coordination System" in the middle. The central system should include:
- FastAPI / API server
- sensor fusion
- urgency score engine
- building priority database
- dashboard API

On the right, show:
- AFAD-like emergency dashboard
- rescue teams
- fire teams
- medical teams
- resource allocation / priority ranking

Make the architecture clearly hybrid: local edge hubs make fast building-level decisions, while the central system coordinates all buildings.

Use a clean white background, blue and gray engineering colors, red only for emergency alarms, readable labels, no cartoon style, no face recognition imagery, no unnecessary decoration. Add a privacy note: "Only summarized risk and anonymous occupancy data are transmitted."
```

## 11. Kısa Sonuç

Sensörlerin yalnızca ham veri göndermesi yerine bina içinde bir edge hub tarafından toplanıp ön değerlendirmeden geçirilmesi daha mantıklıdır. Ancak merkezi sistemi tamamen kaldırmak doğru değildir. Çünkü A-RES'in asıl gücü, çok sayıda binayı aynı anda karşılaştırıp acil müdahale önceliği oluşturabilmesidir.

Bu nedenle önerilen sistem:

```text
Local edge hub for fast building-level reaction
+ 
Central coordination system for multi-building emergency prioritization
```

Bu yapı teknik olarak daha sağlam, maliyet açısından daha gerçekçi ve raporda savunması daha güçlü bir çözümdür.

## 12. Kaynak Notları

Fiyatlar yaklaşık akademik prototip tahminidir. Raspberry Pi 5 4GB için 60 USD civarı MSRP, Raspberry Pi Camera Module 3 için 26.95 USD ve USD/TRY için yaklaşık 45.4 TRY değeri referans alınmıştır. Sensör modülü fiyatları tedarikçiye göre çok değiştiği için düşük-yüksek aralık olarak verilmiştir.
