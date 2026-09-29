import React from 'react';
import { OutpostResources } from '../../engine/simulation-types';
import { LifeSupportGauge } from './life-support-gauge';
import { PowerGridGauge } from './power-grid-gauge';
import { RadiationShieldGauge } from './radiation-shield-gauge';
import { FoodWaterGauge } from './food-water-gauge';

interface TelemetryOverviewProps {
  resources: OutpostResources;
  eclssOperational: boolean;
}

export const TelemetryOverview: React.FC<TelemetryOverviewProps> = ({
  resources,
  eclssOperational,
}) => {
  return (
    <section className="w-full grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 p-3">
      <LifeSupportGauge
        resources={resources}
        eclssOperational={eclssOperational}
      />
      <PowerGridGauge resources={resources} />
      <RadiationShieldGauge resources={resources} />
      <FoodWaterGauge resources={resources} />
    </section>
  );
};
