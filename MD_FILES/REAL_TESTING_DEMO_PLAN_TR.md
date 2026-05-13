# A-RES Reel Test ve Demo Planı

Bu plan, sistemi sınıf içinde üç laptop ile gerçekçi biçimde göstermeyi hedefler. Amaç, her parçayı üretim seviyesinde kurmak değil; A-RES mimarisinin veri akışını uçtan uca kanıtlamaktır.

## 1. Demo Mimarisi

### Laptop 1: Edge Hub ve Kamera

Bu laptop binaya yerleştirilen yerel edge hub gibi davranır.

- Kamera görüntüsünü alır.
- YOLO11n ile insan tespiti yapar.
- ByteTrack ile aynı kişiyi kareler arasında takip eder.
- Kapı girişindeki sanal çizgiden geçen kişiyi giriş veya çıkış olarak sayar.
- Sadece anonim kişi sayısı ve sensör özeti üretir.
- Raw video veya yüz bilgisi merkezi sisteme gönderilmez.

Gönderilen örnek veri:

```json
{
  "building_id": "TR-001",
  "camera_id": "CAM-001",
  "event_type": "count_delta",
  "delta": 1,
  "current_count": 42,
  "confidence": 0.95
}
```

### Laptop 2: Merkezi Koordinasyon Sistemi

Bu laptop A-RES merkezi gibi davranır.

- Edge hub verilerini MQTT veya HTTP üzerinden alır.
- Fire/gas verisini, occupancy verisini ve bina kırılganlık verisini birleştirir.
- Urgency score üretir.
- Dashboard üzerinde binaları öncelik sırasına koyar.
- Authority terminaline sadeleştirilmiş acil durum feed'i sağlar.

Merkezi dashboard:

```text
http://CENTRAL_LAPTOP_IP:8000/dashboard
```

Kurum terminali:

```text
http://CENTRAL_LAPTOP_IP:8000/authority
```

### Laptop 3: AFAD / Yetkili Kurum Terminali

Bu laptop AFAD, itfaiye veya belediye terminali gibi davranır.

- Merkezi laptopun `/authority` ekranını açar.
- En yüksek riskli binaları, kişi sayısını, fire/gas bilgisini ve önerilen aksiyonu görür.
- Bu laptop veri işlemez; sadece merkezi sistemden gelen karar özetini izler.

## 2. Veri Akışı

```text
Kamera ve sensörler
    -> Edge Hub Laptop
    -> MQTT/HTTP mesajı
    -> Merkezi Koordinasyon Laptopu
    -> Urgency Score ve Dashboard
    -> AFAD / Yetkili Kurum Laptopu
```

## 3. Kullanılacak Protokoller

### Yerel Demo İçin

- Edge hub -> Merkez: MQTT veya HTTP
- Merkez -> Dashboard: WebSocket
- Merkez -> Authority terminal: HTTP/JSON

### Neden Bu Mantıklı?

MQTT sensör verisi için hafif ve hızlıdır. HTTP/JSON kurum ekranı için basittir çünkü üçüncü laptop sadece browser ile merkezi sisteme bağlanır. WebSocket dashboard için uygundur çünkü canlı güncelleme gerekir.

## 4. Demo Kurulum Adımları

### 1. Aynı Ağa Bağlanma

Üç laptop aynı Wi-Fi ağına bağlanır. Merkezi laptopun IP adresi öğrenilir.

Windows için:

```powershell
ipconfig
```

IPv4 adresi örnek:

```text
192.168.1.35
```

### 2. Merkezi Sistemi Başlatma

Merkezi laptopta:

```powershell
python -m uvicorn src.server.main:app --host 0.0.0.0 --port 8000
```

Bu komutta `0.0.0.0`, diğer laptopların merkezi sisteme bağlanabilmesini sağlar.

### 3. Edge Hub Simülasyonu veya Kamera Pipeline

İlk demo için simülatör kullanılabilir:

```powershell
python -m src.edge.simulator
```

Kamera hazır olduğunda occupancy pipeline çalıştırılır. Bu pipeline kapı girişindeki canlı görüntüden anonim kişi sayısı üretir.

Eğer MQTT broker kurmak istemiyorsak veya okul ağı sorun çıkarırsa, edge laptop merkezi sisteme HTTP ile doğrudan veri gönderebilir:

```powershell
python -m src.edge.demo_sender --central-url http://192.168.1.35:8000 --building-id DEMO-001 --occupancy 18
```

Fiziksel fire/gas sensörü yoksa smoke/gas olayı kontrollü şekilde mock veri olarak gönderilir:

```powershell
python -m src.edge.demo_sender --central-url http://192.168.1.35:8000 --building-id DEMO-001 --occupancy 18 --smoke --gas
```

Bu komut gerçek sensör olduğunu iddia etmez. Sadece fire/gas verisi geldiğinde merkezi sistemin urgency score'u yükseltmesini, dashboard'u güncellemesini ve authority terminalinde ilgili birime yönlendirme üretmesini test eder.

### 4. Dashboard Açma

Merkezi laptopta veya başka bir cihazda:

```text
http://192.168.1.35:8000/dashboard
```

### 5. AFAD Terminalini Açma

Üçüncü laptopta:

```text
http://192.168.1.35:8000/authority
```

## 5. Reel Kamera Testi Nasıl Yapılır?

Kamera kapının üst veya yan tarafına sabitlenir. Görüntüde kapıdan geçen kişilerin net görüldüğü bir açı seçilir. Sistemde kapı eşiği üzerine sanal bir çizgi tanımlanır.

- Kişi dışarıdan içeri geçerse: `+1`
- Kişi içeriden dışarı geçerse: `-1`
- Kişi çizgiye yaklaşıp geri dönerse: sayım yapılmamalıdır.
- İki kişi yakın geçerse: takip sistemi iki ayrı ID üretmeye çalışmalıdır.

Test sırasında manuel sayım da tutulur. Örneğin 20 giriş ve 8 çıkış yapıldıysa beklenen sonuç `+12` kişidir. Sistem sonucu bu manuel değer ile karşılaştırılır.

Telefon kamerası bu test için yeterlidir. Telefon bu aşamada akıllı cihaz olarak değil, pratik bir kamera kaynağı olarak kullanılır. Görüntü telefonla kaydedilip laptopta işlenebilir veya telefon IP camera/webcam gibi laptopa bağlanabilir. Daha risksiz sınıf demosu için önce kayıtlı kapı videosu kullanmak, canlı kamera gösterimini ise prova sonrasında yapmak daha güvenlidir.

## 6. Gizlilik ve Güvenlik Notu

Demo sisteminde raw video merkezi sisteme gönderilmemelidir. Edge hub sadece kişi sayısı, confidence değeri ve zaman damgası göndermelidir. Yüz tanıma yapılmamalı, kişi kimliği çıkarılmamalıdır. Gerçek uygulamada kamera kullanılan alanda bilgilendirme metni ve KVKK uyumluluk değerlendirmesi gerekir.

## 7. Demo İçin Anlatılacak Kısa Senaryo

1. Edge laptop kapı kamerasından kişi sayısını hesaplar.
2. Fire/gas sensörü veya simülatör tehlike bilgisi üretir.
3. Merkezi laptop bu verileri bina yaşı, yapı tipi, bitişik nizam ve zemin riski gibi statik bilgilerle birleştirir.
4. Sistem urgency score üretir.
5. Dashboard hangi binanın önce ele alınacağını gösterir.
6. AFAD terminali sadece aksiyon alınacak binaları ve önerilen müdahale birimini görür.

Bu senaryo A-RES'in ana fikrini gösterir: veri binadan çıkar, merkezde anlamlandırılır, yetkili kuruma sade ve hızlı karar bilgisi olarak iletilir.
