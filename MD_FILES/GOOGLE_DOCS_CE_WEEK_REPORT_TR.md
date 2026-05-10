# Computer Engineering Weekly Report Text

Bu metin Google Docs raporuna Computer Engineering katkısı olarak eklenebilir.

## Computer Engineering Contribution: IoT, AI and Data Pipeline Design

Bu hafta Computer Engineering ekibi olarak A-RES projesinin yazılım, yapay zeka ve veri akışı tarafını daha uygulanabilir hale getirdik. Projemizin temel amacı, deprem sonrasında binalardan gelen verileri kullanarak acil müdahale ekiplerine hangi binaya önce gidilmesi gerektiğini göstermektir. Bu nedenle sistemimizi yalnızca teorik bir fikir olarak bırakmadık; sensör verisi, bina içindeki kişi sayısı, yangın/gaz riski ve bina kırılganlığı gibi değişkenleri birleştiren bir yazılım mimarisi tasarladık.

Öncelikle projenin iddiasını gerçekçi tuttuk. A-RES depremi önceden tahmin eden bir sistem değildir. Ayrıca bir binanın kesin olarak yıkılıp yıkılmayacağını söyleyen bir yapı hasar teşhis sistemi de değildir. Bizim sistemimiz, deprem sonrası elde edilen verilerle binaları öncelik sırasına koyan bir karar destek sistemidir. Bu yaklaşım hem akademik olarak daha doğru hem de uygulanabilirlik açısından daha güvenlidir.

## System Architecture Design

Tasarladığımız sistem dört ana katmandan oluşmaktadır:

1. Edge cihazlar: Binaya yerleştirilen sensör kutusu ve giriş kamerası.
2. Haberleşme katmanı: MQTT protokolü ile veri gönderimi.
3. Merkezi sunucu: FastAPI tabanlı backend ve urgency score hesaplama motoru.
4. Dashboard: Binaların aciliyet sırasına göre gösterildiği web/mobil arayüz.

Sensör kutusu ivme, sıcaklık, duman ve gaz gibi verileri üretir. Kamera tarafı ise bina giriş ve çıkışlarını saymak için kullanılır. Kamera görüntüsünün merkezi sunucuya gönderilmemesi özellikle önemlidir. Gizlilik açısından sistem yalnızca kişi sayısı gibi anonim sayısal verileri gönderir. Yani yüz tanıma, kimlik tespiti veya kişisel veri işleme yapılmaz.

Veri akışı şu şekildedir:

```text
Sensor / Camera Device -> MQTT Broker -> FastAPI Server -> Urgency Score -> Dashboard
```

Bu yapı sayesinde her bina kendi durumunu merkezi sisteme bildirebilir. Merkezi sistem de bütün binaları aynı anda değerlendirerek acil müdahale önceliği oluşturur.

## Occupancy Estimation Design

Bu hafta özellikle bina içindeki kişi sayısının nasıl tahmin edileceği üzerine çalıştık. Bunun için YOLO11n ve ByteTrack tabanlı bir bilgisayarlı görü sistemi tasarladık. Kamera bina girişine yerleştirilir ve kapı çizgisi üzerinde sanal bir çizgi tanımlanır. Bir kişi bu çizgiyi dışarıdan içeri doğru geçerse giriş, içeriden dışarı doğru geçerse çıkış olarak sayılır.

Sadece görüntüde insan tespit etmek yeterli değildir, çünkü aynı kişi arka arkaya gelen birçok karede tekrar tekrar görülebilir. Bu nedenle tracking kullanılması gerekir. ByteTrack her kişiye geçici bir takip ID'si verir ve sistem kişinin çizgiyi gerçekten geçip geçmediğini izler. Böylece aynı kişi birden fazla kez sayılmamaya çalışılır.

Demo sırasında yanlış sayımı azaltmak için çizgi geçiş mantığına hysteresis ekledik. Bu, kişinin çizgi üzerinde küçük hareketler yapması durumunda sistemin aynı kişiyi tekrar tekrar saymasını azaltır. Ayrıca MQTT mesajlarına sıra numarası eklenmiştir. Böylece mesajlar daha düzenli takip edilebilir.

## Phone Camera Test Plan

Şu anda elimizde özel bir kamera veya Raspberry Pi olmadığı için MVP testini telefon kamerası ile yapmayı planladık. Bu çözüm hem düşük maliyetli hem de proje süresi için daha uygulanabilirdir.

Test planımız:

1. Telefon kapı girişine veya kapının üstüne sabitlenecek.
2. Giriş, çıkış, iki kişinin aynı anda geçmesi ve kişinin çizgiden dönmesi gibi kısa videolar çekilecek.
3. Bu videolar laptop üzerinde YOLO11n + ByteTrack kodundan geçirilecek.
4. Manuel sayım ile sistemin sayımı karşılaştırılacak.
5. Sonuçlar MQTT ile merkezi sunucuya gönderilecek.
6. Dashboard üzerinde bina kişi sayısı ve urgency score güncellenecek.

Bu aşamada YOLO modelini doğrudan mobil uygulama içinde çalıştırmayı MVP kapsamına almadık. Bunun nedeni, mobil cihazda gerçek zamanlı yapay zeka entegrasyonunun kısa süre içinde yüksek teknik risk oluşturmasıdır. Bunun yerine telefon kamera/veri kaynağı olarak kullanılacak, asıl yapay zeka işlemi laptop veya edge cihaz üzerinde çalışacaktır. Gelecekte sistem Raspberry Pi, Jetson Nano veya mini PC üzerinde çalışacak şekilde genişletilebilir.

## Urgency Score Design

A-RES sisteminin en önemli parçası urgency score hesaplamasıdır. Bu skor 0 ile 100 arasında bir değerdir ve binanın acil müdahale ihtiyacını gösterir.

Skor şu faktörlerden oluşur:

| Factor | Description |
|---|---|
| PGA | Binanın hissettiği yer ivmesi / sarsıntı seviyesi |
| Occupancy | Bina içinde tahmin edilen kişi sayısı |
| Smoke / Fire | Duman veya yangın riski |
| Gas Leak | Gaz kaçağı riski |
| Vulnerability | Binanın yaşına/türüne göre kırılganlık tahmini |
| Data Confidence | Verinin güncelliği ve güvenilirliği |

Bu sistemi yapay zeka ile tamamen kara kutu şeklinde kurmak yerine, MVP için rule-based bir formül kullandık. Çünkü acil durum sistemlerinde kararın neden verildiği açıklanabilir olmalıdır. Örneğin bir bina yüksek puan aldıysa bunun nedeni yüksek sarsıntı, fazla kişi sayısı veya yangın/gaz riski gibi açıkça görülebilmelidir.

Priority seviyeleri:

| Score Range | Priority | Meaning |
|---|---|---|
| 0-30 | LOW | İzleme yeterli |
| 31-60 | MEDIUM | Uygun olduğunda inceleme ekibi gönderilebilir |
| 61-80 | HIGH | Kurtarma veya yangın ekibi yönlendirilmeli |
| 81-100 | CRITICAL | Acil müdahale önceliği en yüksek |

## Data for Industrial Engineering Optimization

Industrial Engineering ekibinin optimizasyon çalışması yapabilmesi için örnek bir veri seti hazırladık. Bu veri setinde Japonya ve İstanbul senaryolarına ait örnek binalar bulunmaktadır. Her bina için kişi sayısı, PGA, bina kırılganlığı, duman/gaz durumu, urgency score ve ihtiyaç duyulabilecek ekip sayıları yer almaktadır.

Bu veri setinin amacı, IE ekibinin sınırlı sayıdaki kurtarma, itfaiye ve sağlık ekibini hangi binalara göndermesi gerektiğini modelleyebilmesidir. Örneğin CRITICAL seviyedeki ve içinde çok kişi bulunan bir bina, daha düşük riskli bir binadan önce ele alınmalıdır.

Hazırlanan veri dosyası:

```text
data/optimization_input_template.csv
```

Örnek kolonlar:

```text
building_id, city, building_type, occupancy, pga, vulnerability,
smoke_detected, gas_detected, urgency_score, priority,
required_rescue_units, required_fire_units, required_medical_units
```

Bu veri ile IE ekibi response time, ekip kapasitesi ve priority score kullanarak bir kaynak atama modeli kurabilir.

## GitHub Repository and Tool Selection

Bu hafta ayrıca A-RES için kullanılacak açık kaynak teknolojileri araştırıp filtreledik. Her repository doğrudan proje ihtiyacına göre seçildi.

Seçilen ana teknolojiler:

| Repository / Tool | Purpose |
|---|---|
| Ultralytics YOLO | İnsan tespiti ve tracking API |
| ByteTrack | Kişi takip algoritması |
| Eclipse Mosquitto | MQTT broker |
| Eclipse Paho MQTT Python | Python MQTT client |
| FastAPI | Merkezi backend API |
| pandas / scikit-learn | Veri analizi ve opsiyonel ML modeli |

Bu seçimlerin nedeni, hepsinin iyi dokümante edilmiş, bilinen ve MVP'ye hızlı entegre edilebilir teknolojiler olmasıdır. Proje süresi kısa olduğu için temel altyapıyı sıfırdan yazmak yerine güvenilir açık kaynak araçları kullandık. Bizim özgün katkımız ise bu araçları deprem sonrası acil müdahale önceliklendirme sisteminde birleştirmektir.

## Testing and CI/CD Decision

Projeyi sağlamlaştırmak için hafif bir CI/CD yapısı ekledik. Bu CI sistemi GitHub üzerinde otomatik olarak test çalıştırır. Ancak kamera modeli ve YOLO gibi ağır bağımlılıkları CI içinde çalıştırmadık. Bunun nedeni bu testlerin uzun sürmesi ve GitHub ortamında gereksiz şekilde kırılgan olmasıdır.

CI içinde test edilenler:

1. Urgency score fonksiyonunun doğru priority üretmesi.
2. Kritik bina senaryosunun CRITICAL veya HIGH seviyesine çıkması.
3. Eski ve düşük güvenli verilerde skorun tedbir amaçlı yükselmesi.
4. IE ekibi için hazırlanan CSV dosyasının kolonlarının ve değer aralıklarının doğru olması.

Bu yaklaşım proje için yeterli bir kalite kontrol sağlar. Kamera doğruluğu ise gerçek video testleriyle raporlanacaktır.

## Current Status

Bu hafta sonunda Computer Engineering tarafında şu çıktılar hazırlanmıştır:

| Output | Status |
|---|---|
| Sistem mimarisi | Hazır |
| Occupancy counting tasarımı | Hazır |
| Urgency score engine | Hazır |
| Mock building simulation | Hazır |
| IE optimization CSV template | Hazır |
| GitHub repository selection report | Hazır |
| Lightweight CI tests | Hazır |
| Phone camera real video test | Sonraki adım |

## Next Steps

Sonraki adımda telefon kamerası ile kısa giriş-çıkış videoları çekilecek ve sistemin sayımı manuel sayım ile karşılaştırılacaktır. Daha sonra bu sonuçlar dashboard üzerinde gösterilerek uçtan uca demo tamamlanacaktır. Ayrıca Google Docs raporunda ekonomik analiz, finansal analiz ve feasibility analysis bölümlerine teknik maliyet ve uygulanabilirlik açısından destek verilecektir.

Kısaca, Computer Engineering tarafında bu hafta A-RES'in yazılım altyapısı, veri akışı, occupancy estimation yaklaşımı, GitHub teknoloji seçimi ve optimizasyon verisi hazırlanmıştır. Bu çıktılar projenin sadece fikir aşamasında kalmadığını, test edilebilir bir MVP'ye doğru ilerlediğini göstermektedir.
