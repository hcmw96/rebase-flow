import { useState } from 'react';
import { WidgetProvider, WidgetConfig, GroupedService } from './context/WidgetContext';
import { ServiceList } from './components/ServiceList';
import { BookingModal } from './components/BookingModal';

interface WidgetProps {
  config: WidgetConfig;
}

export function Widget({ config }: WidgetProps) {
  const [selectedService, setSelectedService] = useState<GroupedService | null>(null);

  const handleSelectService = (service: GroupedService) => {
    if (config.showBooking) {
      setSelectedService(service);
    }
  };

  const handleCloseBooking = () => {
    setSelectedService(null);
  };

  return (
    <WidgetProvider config={config}>
      <div 
        className="rebase-widget"
        style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
          backgroundColor: 'hsl(25, 18%, 12%)',
          color: 'hsl(35, 15%, 88%)',
          minHeight: '400px',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        <ServiceList onSelectService={handleSelectService} />
        
        {selectedService && config.showBooking && (
          <BookingModal 
            service={selectedService} 
            onClose={handleCloseBooking} 
          />
        )}
      </div>
    </WidgetProvider>
  );
}
