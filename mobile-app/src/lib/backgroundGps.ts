/**
 * backgroundGps.ts
 * Registers an expo-task-manager background location task so the app
 * keeps emitting GPS updates even when the driver minimises the app.
 *
 * Usage:
 *   import { registerBackgroundGpsTask, startBackgroundGps, stopBackgroundGps } from '@/lib/backgroundGps';
 *   // Call registerBackgroundGpsTask() ONCE at app root (before any navigation)
 *   // Call startBackgroundGps(busId, routeId, socket) when a trip begins
 *   // Call stopBackgroundGps() when a trip ends
 */

import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { getSocket } from '@/lib/socket';

export const BACKGROUND_GPS_TASK = 'smartdtc-background-gps';

// Shared context injected before the task starts
let _busId:    string | null = null;
let _routeId:  string | null = null;

/** Register the task definition. Must be called at module load time (app root). */
export const registerBackgroundGpsTask = () => {
  if (TaskManager.isTaskDefined(BACKGROUND_GPS_TASK)) return;

  TaskManager.defineTask(BACKGROUND_GPS_TASK, ({ data, error }: TaskManager.TaskManagerTaskBody<{ locations: Location.LocationObject[] }>) => {
    if (error) {
      console.error('[BackgroundGPS] Task error:', error.message);
      return;
    }

    const locations = (data as any)?.locations as Location.LocationObject[] | undefined;
    if (!locations || locations.length === 0) return;

    const { latitude, longitude, speed, heading } = locations[locations.length - 1].coords;

    const socket = getSocket();
    if (socket && _busId && _routeId) {
      socket.emit('driver:gps_update', {
        busId:    _busId,
        routeId:  _routeId,
        lat:      latitude,
        lng:      longitude,
        latitude,
        longitude,
        speed:   Math.round((speed || 0) * 3.6),  // m/s → km/h
        heading: heading || 0,
        source:  'background',
      });
    }
  });
};

/** Start background location tracking. Requires foreground permission to have been granted first. */
export const startBackgroundGps = async (busId: string, routeId: string) => {
  _busId   = busId;
  _routeId = routeId;

  const { status } = await Location.requestBackgroundPermissionsAsync();
  if (status !== 'granted') {
    console.warn('[BackgroundGPS] Background location permission not granted.');
    return false;
  }

  const isRunning = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_GPS_TASK).catch(() => false);
  if (isRunning) return true;

  await Location.startLocationUpdatesAsync(BACKGROUND_GPS_TASK, {
    accuracy:                Location.Accuracy.High,
    timeInterval:            15_000,   // every 15 seconds
    distanceInterval:        30,        // or every 30 m
    foregroundService: {
      notificationTitle:    'SmartDTC — Trip in Progress',
      notificationBody:     'GPS tracking is active. Tap to return to the app.',
      notificationColor:    '#003087',
    },
    pausesUpdatesAutomatically: false,
    showsBackgroundLocationIndicator: true,
  });

  console.log('[BackgroundGPS] Started.');
  return true;
};

/** Stop background location tracking. */
export const stopBackgroundGps = async () => {
  _busId   = null;
  _routeId = null;

  const isRunning = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_GPS_TASK).catch(() => false);
  if (isRunning) {
    await Location.stopLocationUpdatesAsync(BACKGROUND_GPS_TASK);
    console.log('[BackgroundGPS] Stopped.');
  }
};
