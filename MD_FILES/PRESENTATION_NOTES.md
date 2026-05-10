# Presentation Notes — A-RES

## Slide Structure (Suggested 15-20 min presentation)

### Slide 1: Title
- **A-RES: Adaptive Response & Earthquake Resilience System**
- Istanbul Beykent University — Applied Project Management
- Team members & departments
- Date: June 2026

### Slide 2: Problem Statement
- Turkey's 2023 earthquakes: $34.2B damage (World Bank)
- After a major earthquake: chaos, uncertainty, delayed response
- Key questions nobody can answer quickly:
  - Which building is damaged?
  - How many people are inside?
  - Is there fire or gas leak?
  - Where should rescue teams go FIRST?

### Slide 3: Our Solution — "Talking Buildings"
- A-RES makes buildings communicate their status automatically
- Each building gets a small sensor box + optional entrance camera
- System calculates an **Urgency Score (0-100)** for every building
- Emergency teams see a **prioritized dashboard**
- Result: Right teams → right building → faster

### Slide 4: System Architecture (Diagram)
- Show the 4-layer architecture diagram
- Edge (sensor + camera) → MQTT → Central Server → Dashboard
- Emphasize: video stays local (privacy), only counts are sent

### Slide 5: Sensor Box Components
- MPU6050 accelerometer → shaking detection
- MQ-2 → smoke & gas
- MQ-7 → carbon monoxide
- BME280 → environmental conditions
- ESP32 → WiFi communication
- Total cost: ~₺3,600 per hub

### Slide 6: Anonymous Occupancy Estimation
- Camera at entrance → YOLO11n person detection → ByteTrack tracking
- Virtual line crossing → entry/exit counting
- **No face recognition, no personal data**
- Only anonymized count events sent to server
- Show screenshot/video of detection working on test video

### Slide 7: Urgency Score Formula
- Show the weighted formula:
  - 30% shaking severity
  - 25% occupancy
  - 20% fire/smoke
  - 15% building vulnerability
  - 10% gas leak
- Show 2-3 example calculations
- Show priority levels: 🟢🟡🟠🔴

### Slide 8: Dashboard Demo
- Show the dashboard (screenshot or live demo)
- Priority-sorted building list
- Map view with color-coded markers
- Real-time updates via WebSocket

### Slide 9: Data Sources
- USGS earthquake catalog (global, free, API)
- Kaggle datasets (curated CSVs for analysis)
- J-SHIS (Japan hazard maps — reference)
- NIED K-NET (Japan strong-motion — reference)
- COCO/CrowdHuman (people detection training)

### Slide 10: Testing & Validation
- 15 occupancy test scenarios
- 7 sensor test scenarios
- 10 communication test scenarios
- Accuracy targets: MAE < 3 people, MAPE < 20%
- Show test results table

### Slide 11: What We Don't Claim
- ❌ We don't predict earthquakes
- ❌ We don't diagnose structural damage
- ❌ We don't replace structural engineers
- ✅ We prioritize emergency response using available data
- ✅ We are a decision support tool, not a decision maker

### Slide 12: Risk Management
- 10 technical risks identified and mitigated
- 5 project management risks
- SWOT analysis highlights
- Show risk matrix

### Slide 13: Budget & Feasibility
- Total project: ₺10,500
- Per sensor hub: ~₺3,600
- Software: all free/open-source
- Timeline: 8 weeks (April 22 - June 15)
- Team: 17 members, 6 departments

### Slide 14: Demo Video
- Play 3-minute demo showing:
  1. Camera counting people entering/exiting
  2. MQTT messages flowing
  3. Server receiving data
  4. Dashboard updating in real-time
  5. Urgency scores changing during simulated earthquake

### Slide 15: Future Work
- Real hardware deployment (Jetson Nano + real sensors)
- ML-optimized urgency scoring
- Mobile app for emergency teams
- Integration with AFAD systems
- Multi-city scaling

### Slide 16: Q&A
- Thank you
- Questions?

---

## Key Talking Points for Q&A Preparation

**Q: "Can you really detect building damage with these sensors?"**
A: We don't claim to detect damage. We measure shaking intensity (PGA) and use building vulnerability data as a proxy. The urgency score is a prioritization aid, not a structural diagnosis.

**Q: "Why not use existing earthquake warning systems?"**
A: Systems like JMA/ShakeAlert warn BEFORE shaking arrives. A-RES works AFTER the earthquake — it helps emergency teams decide WHERE to go first. Different purpose.

**Q: "How accurate is the people counting?"**
A: Our MVP target is MAE < 3 people, which is sufficient for prioritization. We're not trying to get exact counts — even approximate occupancy (0 vs 50 vs 100) dramatically changes response priority.

**Q: "What about privacy?"**
A: No video is stored or transmitted. No faces are recognized. Only anonymized entry/exit counts leave the building. KVKK/GDPR compliant by design.

**Q: "How does this scale?"**
A: MQTT + FastAPI + PostgreSQL can handle hundreds of buildings on a single server. For 1000+, we'd add Kafka and TimescaleDB, but that's a future concern.

---

## English Abstract

**A-RES: Adaptive Response & Earthquake Resilience System** is a university prototype that transforms buildings into autonomous status reporters during earthquake events. Each building is equipped with an Integrated Sensor Hub (accelerometer, smoke/gas sensors, environmental sensors) and an optional entrance camera for anonymous occupancy estimation. The system calculates a real-time Urgency Score (0-100) for each building based on shaking severity, occupancy count, and secondary hazard detection. A centralized dashboard presents buildings in priority order, enabling emergency response teams to dispatch resources to the most critical locations first. The system uses MQTT for IoT communication, YOLO11n for person detection, ByteTrack for multi-object tracking, and a rule-based scoring engine. The architecture is designed for privacy preservation — no video data leaves the building — and avoids overclaiming by presenting itself as a decision support tool rather than a structural damage diagnosis system.

## Turkish Abstract (Türkçe Özet)

**A-RES: Uyarlanabilir Müdahale ve Deprem Dayanıklılık Sistemi**, binaları deprem anında otomatik olarak durum bildiren yapılara dönüştüren bir üniversite prototipidir. Her binaya entegre sensör kutusu (ivmeölçer, duman/gaz sensörleri, çevre sensörleri) ve isteğe bağlı olarak anonim doluluk tahmini için giriş kamerası yerleştirilir. Sistem, her bina için sarsıntı şiddeti, doluluk sayısı ve ikincil tehlike algılamasına dayalı olarak gerçek zamanlı bir Aciliyet Puanı (0-100) hesaplar. Merkezi bir gösterge paneli, binaları öncelik sırasına göre sunarak acil müdahale ekiplerinin kaynakları en kritik konumlara yönlendirmesini sağlar. Sistem, IoT iletişimi için MQTT, kişi tespiti için YOLO11n, çoklu nesne takibi için ByteTrack ve kural tabanlı puanlama motoru kullanır. Mimari, mahremiyet koruma odaklıdır — binadan hiçbir görüntü verisi çıkmaz — ve yapısal hasar teşhis sistemi yerine karar destek aracı olarak sunularak aşırı iddialı olmaktan kaçınır.
