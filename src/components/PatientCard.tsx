import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Activity } from "lucide-react";
import { Patient } from "@/types/patient";
import { cn } from "@/lib/utils";

interface PatientCardProps {
  patient: Patient;
  onClick: (patient: Patient) => void;
}

const PatientCard: React.FC<PatientCardProps> = ({ patient, onClick }) => {
  const getSeverityConfig = (severity: Patient["severity"]) => {
    switch (severity) {
      case "critical":
        return {
          className: "patient-critical pulse-critical",
          badge: "bg-critical text-critical-foreground",
          label: "CRITICAL",
        };
      case "serious":
        return {
          className: "patient-serious",
          badge: "bg-serious text-serious-foreground",
          label: "SERIOUS",
        };
      case "moderate":
        return {
          className: "patient-moderate",
          badge: "bg-moderate text-moderate-foreground",
          label: "MODERATE",
        };
    }
  };

  const severityConfig = getSeverityConfig(patient.severity);

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-300 hover:scale-105 border-2",
        "bg-card hover:bg-card/80 animate-fade-in",
        severityConfig.className
      )}
      onClick={() => onClick(patient)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-lg text-foreground">
              #{patient.ticketNumber}
            </h3>
            <p className="text-sm text-muted-foreground">ID: {patient.id}</p>
          </div>
          <Badge className={cn("text-xs font-bold", severityConfig.badge)}>
            {severityConfig.label}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">ETA:</span>
            <span className="font-semibold text-foreground">{patient.eta}</span>
          </div>

          <div className="flex items-center space-x-2 text-sm">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground truncate">
              {patient.location.address}
            </span>
          </div>

          <div className="flex items-center space-x-2 text-sm">
            <Activity className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">{patient.condition}</span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-border/50">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {patient.age}y {patient.gender}
            </span>
            <span>Unit {patient.ambulanceId}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PatientCard;
