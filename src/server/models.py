from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, JSON, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class Building(Base):
    __tablename__ = "buildings"

    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    vulnerability_index = Column(Float, default=0.5)
    
    # Relationships
    sensors = relationship("SensorHistory", back_populates="building")
    events = relationship("UrgencyEvent", back_populates="building")

class SensorHistory(Base):
    __tablename__ = "sensor_history"

    id = Column(Integer, primary_key=True, index=True)
    building_id = Column(String, ForeignKey("buildings.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    pga = Column(Float)
    temperature = Column(Float)
    humidity = Column(Float)
    smoke_level = Column(Integer)
    co_level = Column(Integer)
    gas_detected = Column(Boolean)
    smoke_detected = Column(Boolean)

    building = relationship("Building", back_populates="sensors")

class UrgencyEvent(Base):
    __tablename__ = "urgency_events"

    id = Column(Integer, primary_key=True, index=True)
    building_id = Column(String, ForeignKey("buildings.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    occupancy_count = Column(Integer)
    urgency_score = Column(Integer)
    priority_level = Column(String) # LOW, MEDIUM, HIGH, CRITICAL
    
    building = relationship("Building", back_populates="events")
