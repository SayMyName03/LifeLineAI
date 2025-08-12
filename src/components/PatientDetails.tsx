import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Heart,
  Thermometer,
  Wind,
  Gauge,
  Clock,
  MapPin,
  AlertTriangle,
  X,
} from "lucide-react";
import { Patient } from "@/types/patient";
import { cn } from "@/lib/utils";
import PatientMap from "@/components/PatientMap";

interface PatientDetailsProps {
  patient: Patient | null;
  isOpen: boolean;
  onClose: () => void;
  onReject: (patientId: string) => void;
}

const PatientDetails: React.FC<PatientDetailsProps> = ({
  patient,
  isOpen,
  onClose,
  onReject,
}) => {
  if (!patient) return null;

  const getSeverityConfig = (severity: Patient["severity"]) => {
    switch (severity) {
      case "critical":
        return {
          badge: "bg-critical text-critical-foreground",
          label: "CRITICAL",
        };
      case "serious":
        return {
          badge: "bg-serious text-serious-foreground",
          label: "SERIOUS",
        };
      case "moderate":
        return {
          badge: "bg-moderate text-moderate-foreground",
          label: "MODERATE",
        };
    }
  };

  const severityConfig = getSeverityConfig(patient.severity);

  const handleReject = () => {
    if (
      confirm(
        `Are you sure you want to reject patient ${patient.ticketNumber}? This action cannot be undone.`
      )
    ) {
      onReject(patient.id);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <DialogTitle className="text-xl">
                Patient #{patient.ticketNumber}
              </DialogTitle>
              <Badge className={cn("text-xs font-bold", severityConfig.badge)}>
                {severityConfig.label}
              </Badge>
            </div>
            {/* Removed custom close button, DialogContent provides the close (X) */}
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Patient Info & Vitals */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Heart className="h-5 w-5 text-primary" />
                  <span>Vital Signs</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Heart className="h-4 w-4 text-red-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Heart Rate
                      </p>
                      <p className="font-semibold">
                        {patient.vitals.heartRate} BPM
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Gauge className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Blood Pressure
                      </p>
                      <p className="font-semibold">
                        {patient.vitals.bloodPressure.systolic}/
                        {patient.vitals.bloodPressure.diastolic}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Wind className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        O2 Saturation
                      </p>
                      <p className="font-semibold">
                        {patient.vitals.oxygenSaturation}%
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Thermometer className="h-4 w-4 text-orange-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Temperature
                      </p>
                      <p className="font-semibold">
                        {patient.vitals.temperature}°F
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    Respiratory Rate
                  </p>
                  <p className="font-semibold">
                    {patient.vitals.respiratoryRate} /min
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <span>Timeline</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Expected Arrival:
                  </span>
                  <span className="font-semibold">{patient.eta}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Patient Age/Gender:
                  </span>
                  <span className="font-semibold">
                    {patient.age}y {patient.gender}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ambulance Unit:</span>
                  <span className="font-semibold">{patient.ambulanceId}</span>
                </div>
                <div className="pt-2 border-t border-border">
                  <p className="text-sm text-muted-foreground">Condition</p>
                  <p className="font-semibold">{patient.condition}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Map */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span>Live Location</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 rounded-lg overflow-hidden">
                  <PatientMap patient={patient} />
                </div>
                <div className="mt-3 p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Current Location
                  </p>
                  <p className="font-medium">{patient.location.address}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {patient.location.lat.toFixed(6)},{" "}
                    {patient.location.lng.toFixed(6)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-border">
          <Button
            variant="destructive"
            onClick={handleReject}
            className="flex items-center space-x-2"
          >
            <AlertTriangle className="h-4 w-4" />
            <span>Reject Case</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PatientDetails;
