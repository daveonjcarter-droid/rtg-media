import type { Operator } from "./types";

// Network + leaderboard roster. Order does not matter; leaderboard sorts by `standing`.
// CROSS's standing here is overridden at runtime by the Director panel / scene state.

export const operators: Operator[] = [
  { id: "saint", codename: "SAINT", status: "IN FIELD", specialty: "RESOLUTION", region: "EUROPE / WEST", tier: "BLACK", standing: 1, completion: 99, discretion: 99, contractValue: 6_840_000, responseRating: 5.0, avatarSeed: 2, joined: "2016" },
  { id: "vanta", codename: "VANTA", status: "ONLINE", specialty: "RECOVERY", region: "ASIA / PACIFIC", tier: "BLACK", standing: 2, completion: 98, discretion: 97, contractValue: 5_910_000, responseRating: 4.9, avatarSeed: 5, joined: "2017" },
  { id: "moth", codename: "MOTH", status: "AVAILABLE", specialty: "OBSERVATION", region: "NORTH AMERICA / EAST", tier: "BLACK", standing: 3, completion: 98, discretion: 99, contractValue: 5_220_000, responseRating: 4.9, avatarSeed: 8, joined: "2018" },
  { id: "cross", codename: "CROSS", status: "ONLINE", specialty: "RESOLUTION", region: "NORTH AMERICA / CENTRAL", tier: "BLACK", standing: 4, completion: 97, discretion: 98, contractValue: 4_870_000, responseRating: 4.9, avatarSeed: 13, joined: "2019" },
  { id: "wolf09", codename: "WOLF//09", status: "CONTRACT ACTIVE", specialty: "SECURE TRANSPORT", region: "EUROPE / EAST", tier: "SLATE", standing: 5, completion: 96, discretion: 94, contractValue: 4_100_000, responseRating: 4.7, avatarSeed: 17, joined: "2018" },
  { id: "heron", codename: "HERON", status: "OFFLINE", specialty: "RECOVERY", region: "SOUTH AMERICA", tier: "SLATE", standing: 6, completion: 95, discretion: 96, contractValue: 3_760_000, responseRating: 4.8, avatarSeed: 21, joined: "2020" },
  { id: "jackal", codename: "JACKAL", status: "SUSPENDED", specialty: "RESOLUTION", region: "MIDDLE EAST", tier: "SLATE", standing: 7, completion: 93, discretion: 81, contractValue: 3_540_000, responseRating: 4.2, avatarSeed: 29, joined: "2017" },
  { id: "lark", codename: "LARK", status: "AVAILABLE", specialty: "OBSERVATION", region: "NORTH AMERICA / WEST", tier: "SLATE", standing: 8, completion: 95, discretion: 97, contractValue: 2_980_000, responseRating: 4.8, avatarSeed: 31, joined: "2021" },
  { id: "quill", codename: "QUILL", status: "IN FIELD", specialty: "DOCUMENT RECOVERY", region: "EUROPE / NORTH", tier: "WHITE", standing: 9, completion: 94, discretion: 95, contractValue: 2_410_000, responseRating: 4.6, avatarSeed: 37, joined: "2021" },
  { id: "ember", codename: "EMBER", status: "ONLINE", specialty: "SECURE TRANSPORT", region: "AFRICA / WEST", tier: "WHITE", standing: 10, completion: 92, discretion: 93, contractValue: 1_960_000, responseRating: 4.5, avatarSeed: 41, joined: "2022" },
  { id: "pike", codename: "PIKE", status: "OFFLINE", specialty: "RESOLUTION", region: "NORTH AMERICA / SOUTH", tier: "WHITE", standing: 11, completion: 90, discretion: 92, contractValue: 1_620_000, responseRating: 4.4, avatarSeed: 43, joined: "2023" },
  { id: "nine", codename: "NINE", status: "AVAILABLE", specialty: "OBSERVATION", region: "ASIA / EAST", tier: "PROVISIONAL", standing: 12, completion: 100, discretion: 95, contractValue: 410_000, responseRating: 4.7, avatarSeed: 47, joined: "2026" },
];
