import React from "react";
import { Badge } from "@/components/ui/badge";
import { Activity, Bed, Users } from "lucide-react";
import { Hospital } from "@/types/patient";

interface HospitalHeaderProps {
  hospital: Hospital;
  totalPatients: number;
}

const HospitalHeader: React.FC<HospitalHeaderProps> = ({
  hospital,
  totalPatients,
}) => {
  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <Activity className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {hospital.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                Emergency Operations Center
              </p>
            </div>
          </div>
          <Badge
            variant={hospital.status === "online" ? "default" : "destructive"}
            className="ml-4"
          >
            <div
              className={`w-2 h-2 rounded-full mr-2 ${
                hospital.status === "online" ? "bg-success" : "bg-destructive"
              }`}
            />
            {hospital.status.toUpperCase()}
          </Badge>
        </div>

        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2 text-sm">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">Incoming:</span>
            <span className="font-semibold text-foreground">
              {totalPatients}
            </span>
          </div>

          <div className="flex items-center space-x-2 text-sm">
            <Bed className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">Available Beds:</span>
            <span className="font-semibold text-foreground">
              {hospital.availableBeds}/{hospital.totalBeds}
            </span>
          </div>

          <div className="text-sm text-muted-foreground">
            {new Date().toLocaleString("en-US", {
              weekday: "short",
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </div>
        </div>
      </div>
    </header>
  );
};

export default HospitalHeader;
