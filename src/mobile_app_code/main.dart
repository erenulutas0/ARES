import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:web_socket_channel/web_socket_channel.dart';

void main() {
  runApp(const AresMobileApp());
}

class AresMobileApp extends StatelessWidget {
  const AresMobileApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'A-RES Mobile',
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF0F172A),
        primaryColor: const Color(0xFF3B82F6),
        fontFamily: 'Roboto',
      ),
      home: const DashboardScreen(),
      debugShowCheckedModeBanner: false,
    );
  }
}

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  late WebSocketChannel _channel;
  List<dynamic> _buildings = [];
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    _connectWebSocket();
  }

  void _connectWebSocket() {
    // Replace with your laptop's IP address
    final wsUrl = Uri.parse('ws://192.168.1.102:8000/ws/dashboard');
    _channel = WebSocketChannel.connect(wsUrl);
    _channel.stream.listen(
      (data) {
        setState(() {
          _buildings = jsonDecode(data);
          // Sort by urgency
          _buildings.sort((a, b) => (b['urgency_score'] as num).compareTo(a['urgency_score'] as num));
        });
      },
      onError: (error) => print('WS Error: $error'),
      onDone: () {
        // Reconnect logic can be added here
        Future.delayed(const Duration(seconds: 3), _connectWebSocket);
      },
    );
  }

  @override
  void dispose() {
    _channel.sink.close();
    super.dispose();
  }

  void _dispatchTeam(BuildContext context, String buildingId) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.check_circle, color: Colors.white),
            const SizedBox(width: 10),
            Text('Rescue Team Dispatched to $buildingId!'),
          ],
        ),
        backgroundColor: Colors.green.shade600,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        duration: const Duration(seconds: 3),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        elevation: 0,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [Colors.blue, Colors.indigo]),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Text('A', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            ),
            const SizedBox(width: 10),
            const Text('A-RES ', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            const Text('MOBILE', style: TextStyle(fontWeight: FontWeight.w300, fontSize: 18, color: Colors.grey)),
          ],
        ),
        actions: [
          Center(
            child: Padding(
              padding: const EdgeInsets.only(right: 16.0),
              child: Row(
                children: [
                  Container(
                    width: 8,
                    height: 8,
                    decoration: const BoxDecoration(color: Colors.greenAccent, shape: BoxShape.circle),
                  ),
                  const SizedBox(width: 5),
                  const Text('ACTIVE', style: TextStyle(color: Colors.greenAccent, fontSize: 10, fontWeight: FontWeight.bold)),
                ],
              ),
            ),
          )
        ],
      ),
      body: _currentIndex == 0 ? _buildTriageList() : _buildPlaceholder('Coming Soon'),
      bottomNavigationBar: BottomNavigationBar(
        backgroundColor: const Color(0xFF1E293B),
        selectedItemColor: Colors.blueAccent,
        unselectedItemColor: Colors.grey,
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.warning_amber_rounded), label: 'Triage'),
          BottomNavigationBarItem(icon: Icon(Icons.map_outlined), label: 'Map'),
          BottomNavigationBarItem(icon: Icon(Icons.camera_alt_outlined), label: 'Camera'),
        ],
      ),
    );
  }

  Widget _buildTriageList() {
    if (_buildings.isEmpty) {
      return const Center(child: CircularProgressIndicator(color: Colors.blueAccent));
    }

    return ListView.builder(
      padding: const EdgeInsets.all(12),
      itemCount: _buildings.length,
      itemBuilder: (context, index) {
        final b = _buildings[index];
        final priority = b['priority'] as String;
        Color priorityColor = Colors.blue;
        if (priority == 'CRITICAL') priorityColor = Colors.redAccent;
        if (priority == 'HIGH') priorityColor = Colors.orangeAccent;
        if (priority == 'MEDIUM') priorityColor = Colors.amberAccent;

        return Card(
          color: const Color(0xFF1E293B).withOpacity(0.8),
          margin: const EdgeInsets.only(bottom: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: BorderSide(color: priorityColor.withOpacity(0.5), width: 1),
          ),
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(b['building_id'], style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white)),
                        Text(b['type'].toString().toUpperCase(), style: const TextStyle(fontSize: 12, color: Colors.grey)),
                      ],
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text('${b['urgency_score']}', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: priorityColor)),
                        const Text('AI SCORE', style: TextStyle(fontSize: 10, color: Colors.grey, letterSpacing: 1)),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(color: Colors.black26, borderRadius: BorderRadius.circular(8)),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Occupants', style: TextStyle(fontSize: 12, color: Colors.grey)),
                            Text('${b['occupancy']}', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(color: Colors.black26, borderRadius: BorderRadius.circular(8)),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('PGA', style: TextStyle(fontSize: 12, color: Colors.grey)),
                            Text('${(b['pga'] as num).toStringAsFixed(3)}g', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: priorityColor)),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
                if (b['smoke_detected'] == true || b['gas_detected'] == true) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(color: Colors.redAccent.withOpacity(0.2), borderRadius: BorderRadius.circular(8), border: Border.all(color: Colors.redAccent.withOpacity(0.5))),
                    child: Row(
                      children: [
                        const Icon(Icons.local_fire_department, color: Colors.redAccent, size: 16),
                        const SizedBox(width: 8),
                        Text(
                          '${b['smoke_detected'] == true ? "FIRE " : ""}${b['gas_detected'] == true ? "GAS LEAK" : ""}',
                          style: const TextStyle(color: Colors.redAccent, fontSize: 12, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  )
                ],
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () => _dispatchTeam(context, b['building_id']),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blueAccent,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    icon: const Icon(Icons.directions_car),
                    label: const Text('DISPATCH RESCUE TEAM', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                )
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildPlaceholder(String text) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.construction, size: 64, color: Colors.grey.shade700),
          const SizedBox(height: 16),
          Text(text, style: TextStyle(fontSize: 18, color: Colors.grey.shade500, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }
}
