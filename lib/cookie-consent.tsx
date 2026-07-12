"use client";

import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";

export type CookieConsent = {
	necessary: true;
	vimeo: boolean;
};

type StoredConsent = CookieConsent & { timestamp: number };

const STORAGE_KEY = "ytl-cookie-consent";
const CONSENT_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

type Listener = () => void;
const listeners = new Set<Listener>();

const notifyListeners = () => {
	listeners.forEach((listener) => listener());
};

const subscribe = (listener: Listener) => {
	listeners.add(listener);
	window.addEventListener("storage", listener);

	return () => {
		listeners.delete(listener);
		window.removeEventListener("storage", listener);
	};
};

const parseConsent = (raw: string | null): CookieConsent | null => {
	if (!raw) {
		return null;
	}

	try {
		const parsed = JSON.parse(raw) as Partial<StoredConsent>;

		if (!parsed.timestamp || Date.now() - parsed.timestamp > CONSENT_MAX_AGE_MS) {
			return null;
		}

		return { necessary: true, vimeo: Boolean(parsed.vimeo) };
	} catch {
		return null;
	}
};

let cachedRaw: string | null = null;
let cachedConsent: CookieConsent | null = null;

const getSnapshot = (): CookieConsent | null => {
	const raw = window.localStorage.getItem(STORAGE_KEY);

	if (raw !== cachedRaw) {
		cachedRaw = raw;
		cachedConsent = parseConsent(raw);
	}

	return cachedConsent;
};
const getServerSnapshot = (): CookieConsent | null => null;

const persistConsent = (next: CookieConsent) => {
	const stored: StoredConsent = { ...next, timestamp: Date.now() };

	try {
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
	} catch {
		// ignore storage errors (e.g. private browsing / storage disabled)
	}

	notifyListeners();
};

type CookieConsentContextValue = {
	consent: CookieConsent | null;
	vimeoAllowed: boolean;
	isSettingsOpen: boolean;
	acceptAll: () => void;
	rejectOptional: () => void;
	setVimeo: (value: boolean) => void;
	openSettings: () => void;
	closeSettings: () => void;
};

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

export function CookieConsentProvider({ children }: { children: ReactNode }) {
	const consent = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);

	const acceptAll = useCallback(() => {
		persistConsent({ necessary: true, vimeo: true });
		setIsSettingsOpen(false);
	}, []);

	const rejectOptional = useCallback(() => {
		persistConsent({ necessary: true, vimeo: false });
		setIsSettingsOpen(false);
	}, []);

	const setVimeo = useCallback((value: boolean) => {
		persistConsent({ necessary: true, vimeo: value });
	}, []);

	const openSettings = useCallback(() => setIsSettingsOpen(true), []);
	const closeSettings = useCallback(() => setIsSettingsOpen(false), []);

	const value = useMemo<CookieConsentContextValue>(
		() => ({
			consent,
			vimeoAllowed: consent?.vimeo ?? false,
			isSettingsOpen,
			acceptAll,
			rejectOptional,
			setVimeo,
			openSettings,
			closeSettings,
		}),
		[consent, isSettingsOpen, acceptAll, rejectOptional, setVimeo, openSettings, closeSettings],
	);

	return <CookieConsentContext.Provider value={value}>{children}</CookieConsentContext.Provider>;
}

export function useCookieConsent() {
	const context = useContext(CookieConsentContext);

	if (!context) {
		throw new Error("useCookieConsent must be used within a CookieConsentProvider");
	}

	return context;
}
