import { Power } from 'lucide-react';
import { PAGE_CARD_CLASS } from '../../styles/pageClasses';
import { ManagerSectionHeader } from '../manager/shared/ManagerSectionHeader';
import { ShiftControls } from './shift/ShiftControls';
import { ShiftStatusCard } from './shift/ShiftStatusCard';
import { useDriverShiftPage } from './shift/useDriverShiftPage';

export default function DriverShiftPage() {
  const shift = useDriverShiftPage();

  return (
    <section className={PAGE_CARD_CLASS}>
      <ManagerSectionHeader
        icon={<Power className="h-7 w-7" strokeWidth={2} />}
        title="Зміна"
        subtitle="Керуйте статусом вручну або через автостатус."
      />

      {shift.error ? <div className="field-error-box mb-4">{shift.error}</div> : null}

      <ShiftStatusCard loading={shift.loading} statusLabel={shift.currentStatusLabel} />

      <ShiftControls
        loading={shift.loading}
        saving={shift.saving}
        breakSaving={shift.breakSaving}
        nextManualStatus={shift.nextManualStatus}
        manualButtonText={shift.manualButtonText}
        statusControlsDisabled={shift.statusControlsDisabled}
        onBreak={shift.onBreak}
        breakDisabled={shift.breakDisabled}
        isAutoEnabled={shift.isAutoEnabled}
        onManualStatus={(status) => void shift.setManualStatus(status)}
        onToggleBreak={() => void shift.toggleBreak()}
      />
    </section>
  );
}
