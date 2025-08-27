import { defineCollection, z } from 'astro:content';
import { file, glob } from 'astro/loaders';

const projects = defineCollection({
  loader: file('./src/data/projects.json'),
  schema: z.object({
    id: z.number(),
    title: z.string(),
    description: z.string().default("No description."),
    url: z.string(),
    tags: z.union([z.string(), z.array(z.string()), z.null()]).optional(),
  })
});

const experiences = defineCollection({
  loader: file('./src/data/experiences.json'),
  schema: z.object({
    id: z.number(),
    title: z.string(),
    description: z.string(),
    startDate: z.string(),
    endDate: z.string(),
  })
});

const events = defineCollection({
  loader: glob({ pattern: "*/*/*.{md,mdx}", base: "./src/data/events" }),
  schema: z.object({
    title: z.string(),
    description: z.string().default("No description."),
    start: z.date().optional(),
    end: z.date().optional(),
    location: z.string().optional(),
    format: z.string().optional(),
    url: z.string().optional()
  })
});

const eventChallenges = defineCollection({
  loader: glob({ pattern: "*/*/*/*/*.{md,mdx}", base: "./src/data/events" }),
  schema: z.object({
    title: z.string(),
    category: z.union([z.string(), z.array(z.string()), z.null()]).optional(),
    tags: z.union([z.string(), z.array(z.string()), z.null()]).optional(),
    draft: z.boolean().optional(),
    completedDuringEvent: z.boolean().optional(),
    submitted: z.boolean().optional(),
    points: z.number().default(-1),
    solves: z.number().default(-1),
    flag: z.string().optional(),
    flags: z.array(z.string()).optional(),
  })
});

export const collections = {
  projects,
  experiences,
  events,
  eventChallenges
};
