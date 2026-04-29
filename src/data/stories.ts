import storyMusic from "@/assets/story-music.jpg";
import storyFilm from "@/assets/story-film.jpg";
import storyFashion from "@/assets/story-fashion.jpg";
import storyBreakdown from "@/assets/story-breakdown.jpg";
import portfolio1 from "@/assets/portfolio-1.jpg";
import portfolio2 from "@/assets/portfolio-2.jpg";
import portfolio3 from "@/assets/portfolio-3.jpg";
import portfolio4 from "@/assets/portfolio-4.jpg";

export type Story = {
  id: string;
  title: string;
  category: string;
  author: string;
  date: string;
  image: string;
  excerpt: string;
};

export const STORIES: Story[] = [
  {
    id: "chicago-new-wave",
    title: "Chicago's New Wave Is Taking Over",
    category: "Music",
    author: "Daveon J. Carter",
    date: "May 20, 2026",
    image: storyMusic,
    excerpt: "A new generation of Chicago artists is rewriting the city's sound — and the rest of the world is finally catching up.",
  },
  {
    id: "future-black-cinema",
    title: "The Future of Black Cinema Is Here",
    category: "Film",
    author: "BRENDYN SHIELDS",
    date: "May 18, 2026",
    image: storyFilm,
    excerpt: "Independent Black filmmakers are no longer waiting for permission. Inside the rise of a new cinematic era.",
  },
  {
    id: "chicago-fashion",
    title: "The Chicago Influence on Global Fashion",
    category: "Fashion",
    author: "RTG Media",
    date: "May 16, 2026",
    image: storyFashion,
    excerpt: "From the South Side to Paris runways — how Chicago became the blueprint for streetwear's new era.",
  },
  {
    id: "breaking-final-season",
    title: "Breaking Down the Final Season",
    category: "RTG Breakdown",
    author: "Daveon J. Carter",
    date: "May 15, 2026",
    image: storyBreakdown,
    excerpt: "Every frame, every callback, every Easter egg — our full breakdown of the year's most talked-about finale.",
  },
  {
    id: "studio-portrait",
    title: "Inside the Studio With Tomorrow's Headliners",
    category: "Music",
    author: "RTG Media",
    date: "May 12, 2026",
    image: portfolio1,
    excerpt: "We spent 48 hours with the artists shaping what comes next.",
  },
  {
    id: "midnight-chicago",
    title: "Midnight in Chicago",
    category: "Chicago Culture",
    author: "BRENDYN SHIELDS",
    date: "May 10, 2026",
    image: portfolio2,
    excerpt: "A photo essay on the city after the lights go down.",
  },
  {
    id: "music-video-cars",
    title: "The Cinematography Behind the Year's Biggest Music Videos",
    category: "Film",
    author: "RTG Media",
    date: "May 7, 2026",
    image: portfolio3,
    excerpt: "We talked to the directors framing the biggest sounds of 2026.",
  },
  {
    id: "live-energy",
    title: "Live Energy: The Return of the Hometown Show",
    category: "Entertainment",
    author: "Daveon J. Carter",
    date: "May 4, 2026",
    image: portfolio4,
    excerpt: "Why intimate venues are the new arenas for the next generation.",
  },
];

export const CATEGORIES = [
  "All",
  "Music",
  "Film",
  "Fashion",
  "Chicago Culture",
  "Entertainment",
  "Sports",
  "RTG Breakdown",
  "Opinion",
];
