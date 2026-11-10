import { useRef, useState } from 'react';
import { useStore } from '../state/store.jsx';
import { ALARMS, LIMITS } from '../lib/defaults.js';
import { exportJSON, parseImport } from '../lib/storage.js';
import { playAlarm, unlockAudio } from '../lib/sound.js';
import { permissionState, requestPermission, sendNotification } from '../lib/notify.js';
import { download } from '../hooks.js';
import { Button, Card, ConfirmDialog, NumberField, SelectRow, Segmented, Slider, Toggle } from '../components/ui.jsx';
import { IconBell, IconDownload, IconMoon, IconSun, IconUpload, IconSliders } from '../components/Icons.jsx';

export default function SettingsPage() {
  const { state, actions } = useStore();
  const s = state.settings;
  const set = actions.updateSettings;
  const fileRef = useRef(null);
  const [perm, setPerm] = useState(permissionState());
  const [pending, setPending] = useState(null); // parsed import awaiting confirmation
  const [confirmReset, setConfirmReset] = useState(false);

  const toggleNotify = async (on) => {
    if (!on) return set({ notifyOn: false });
    const result = await requestPermission();
    setPerm(result);
    if (result === 'granted') set({ notifyOn: true });
    else actions.toast(result === 'unsupported' ? 'This browser does not support notifications.' : 'Notifications are blocked. Allow them in your browser site settings.');
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 5_000_000) return actions.toast('That file is too large to be a Slowburn export.');
    const res = parseImport(await file.text());
    if (res.ok) setPending(res.state);
    else actions.toast(res.error);
  };

  return (
    <div className="settings">
      <div className="page-head">
        <h1 className="page-title" tabIndex={-1}>Settings</h1>
        <p className="page-sub">Tune the rhythm. Changes apply immediately and are saved in this browser.</p>
      </div>

      <Card eyebrow="Rhythm" title="Timer">
        <NumberField label="Focus session" unit="min" value={s.focusMin} min={LIMITS.focusMin[0]} max={LIMITS.focusMin[1]} onChange={(v) => set({ focusMin: v })} hint="Default 25" id="set-focus" />
        <NumberField label="Short break" unit="min" value={s.shortMin} min={LIMITS.shortMin[0]} max={LIMITS.shortMin[1]} onChange={(v) => set({ shortMin: v })} hint="Default 5" id="set-short" />
        <NumberField label="Long break" unit="min" value={s.longMin} min={LIMITS.longMin[0]} max={LIMITS.longMin[1]} onChange={(v) => set({ longMin: v })} hint="Default 15" id="set-long" />
        <NumberField label="Long break every" unit="sessions" value={s.longEvery} min={LIMITS.longEvery[0]} max={LIMITS.longEvery[1]} onChange={(v) => set({ longEvery: v })} hint="Default 4" id="set-every" />
        <Toggle id="set-auto-breaks" label="Start breaks automatically" hint="The next break begins the moment a session ends." checked={s.autoStartBreaks} onChange={(v) => set({ autoStartBreaks: v })} />
        <Toggle id="set-auto-focus" label="Start focus automatically" hint="Skip the pause between a break and the next session." checked={s.autoStartFocus} onChange={(v) => set({ autoStartFocus: v })} />
        <NumberField label="Daily goal" unit="sessions" value={s.dailyGoal} min={LIMITS.dailyGoal[0]} max={LIMITS.dailyGoal[1]} onChange={(v) => set({ dailyGoal: v })} hint="Used by the ring in Insights" id="set-goal" />
      </Card>

      <Card eyebrow="Alerts" title="Sound and notifications">
        <Toggle id="set-sound" label="Play a sound when a session ends" checked={s.soundOn} onChange={(v) => set({ soundOn: v })} />
        <SelectRow label="Alarm" value={s.alarm} onChange={(v) => { set({ alarm: v }); unlockAudio(); playAlarm(v, s.volume, 1); }} options={ALARMS} />
        <Slider label="Volume" value={s.volume} onChange={(v) => set({ volume: v })} format={(v) => `${Math.round(v * 100)}%`} />
        <NumberField label="Repeat" unit="times" value={s.repeat} min={LIMITS.repeat[0]} max={LIMITS.repeat[1]} onChange={(v) => set({ repeat: v })} hint="How often the alarm plays" id="set-repeat" />
        <Toggle id="set-notify" label="Desktop notifications" checked={s.notifyOn && perm === 'granted'} onChange={toggleNotify}
          hint={perm === 'denied' ? 'Blocked by your browser. Allow notifications for this site to use this.' : perm === 'unsupported' ? 'Not supported in this browser.' : 'Shown when a session ends while this tab is in the background.'} />
        <div className="row-actions">
          <Button icon={<IconBell size={16} />} onClick={() => { unlockAudio(); playAlarm(s.alarm, s.volume, 1); }}>Test sound</Button>
          <Button onClick={() => { if (!sendNotification('Test notification', 'This is what a finished session looks like.')) actions.toast('Turn on notifications first.'); }}>Test notification</Button>
        </div>
      </Card>

      <Card eyebrow="Look" title="Appearance">
        <div className="row">
          <div className="row-text"><span className="row-label" id="theme-label">Theme</span><p className="row-hint">System follows your device.</p></div>
          <Segmented label="Theme" value={s.theme} onChange={(v) => set({ theme: v })}
            options={[
              { value: 'light', label: 'Light', icon: <IconSun size={16} /> },
              { value: 'dark', label: 'Dark', icon: <IconMoon size={16} /> },
              { value: 'system', label: 'System', icon: <IconSliders size={16} /> },
            ]} />
        </div>
      </Card>

      <Card eyebrow="Yours" title="Your data">
        <p className="row-hint" style={{ maxWidth: 'none' }}>Tasks, history and settings live in this browser only. Export a copy to move to another device or keep a backup.</p>
        <div className="row-actions">
          <Button icon={<IconDownload size={16} />} onClick={() => download('slowburn-backup.json', exportJSON(state), 'application/json')}>Export backup</Button>
          <Button icon={<IconUpload size={16} />} onClick={() => fileRef.current?.click()}>Import backup</Button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" aria-label="Import backup file" onChange={onFile} tabIndex={-1} />
          <Button variant="danger" onClick={() => setConfirmReset(true)}>Erase everything</Button>
        </div>
      </Card>

      <ConfirmDialog open={!!pending} title="Replace your data?" confirmLabel="Replace" danger={false}
        body={pending ? `The backup has ${pending.tasks.length} tasks and ${pending.history.length} logged sessions. They will replace what is here now.` : ''}
        onCancel={() => setPending(null)}
        onConfirm={() => { actions.replaceAll(pending); setPending(null); actions.toast('Backup restored.'); }} />
      <ConfirmDialog open={confirmReset} title="Erase everything?" confirmLabel="Erase"
        body="Tasks, history, settings and the running timer will be deleted from this browser. This cannot be undone."
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => { actions.resetAll(); setConfirmReset(false); actions.toast('All data erased.'); }} />
    </div>
  );
}
