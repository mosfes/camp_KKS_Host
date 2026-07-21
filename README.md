# Next.js & HeroUI Template

## Camp location tracking

The camp tracking screen uses Google Maps JavaScript API, Places API (New),
Routes API, and Geocoding API for destination lookup, map display, the student's
route to the camp destination, and the student's current Thai administrative
area. Create a browser API key restricted to the application's HTTPS domains and
enable all four APIs:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_browser_key
NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=your_map_id
```

Apply Prisma migrations before starting the updated application. Browser GPS
requires HTTPS in production (localhost is allowed during development).
Teachers can search or click the Google Map to pin a destination and choose a
5- or 10-minute update interval. Each registered student publishes only their
own location while the camp page is open. Teachers can see all registered
students, while a parent can see only the student linked to their account.

The student route uses the Routes Essentials tier without live traffic. It is
calculated only when the student opens the map, cached in the browser for 15
minutes, reused while the student remains within 500 metres of the cached
origin, and manually refreshable with a one-minute cooldown. If Routes API is
unavailable, the UI falls back to a straight line and an approximate distance.
The reverse-geocoded subdistrict, district, and province are stored in the same
cache and requested only after the student opens the map, so page visits and GPS
polling do not generate additional Geocoding requests.
To prevent unexpected charges, set billing alerts for the project and a daily
quota for Routes: Compute Routes Essentials. A daily Routes quota around 300
requests keeps a 31-day month below 10,000 requests. Dynamic Maps usage is
reduced by loading the map only after the student presses the display button.

This is a template for creating applications using Next.js 14 (app directory) and HeroUI (v2).

[Try it on CodeSandbox](https://githubbox.com/heroui-inc/heroui/next-app-template)

## Technologies Used

- [Next.js 14](https://nextjs.org/docs/getting-started)
- [HeroUI v2](https://heroui.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Tailwind Variants](https://tailwind-variants.org)
- [TypeScript](https://www.typescriptlang.org/)
- [Framer Motion](https://www.framer.com/motion/)
- [next-themes](https://github.com/pacocoursey/next-themes)

## How to Use

### Use the template with create-next-app

To create a new project based on this template using `create-next-app`, run the following command:

```bash
npx create-next-app -e https://github.com/heroui-inc/next-app-template
```

### Install dependencies

You can use one of them `npm`, `yarn`, `pnpm`, `bun`, Example using `npm`:

```bash
npm install
```

### Run the development server

```bash
npm run dev
```

### Setup pnpm (optional)

If you are using `pnpm`, you need to add the following code to your `.npmrc` file:

```bash
public-hoist-pattern[]=*@heroui/*
```

After modifying the `.npmrc` file, you need to run `pnpm install` again to ensure that the dependencies are installed correctly.

## License

Licensed under the [MIT license](https://github.com/heroui-inc/next-app-template/blob/main/LICENSE).
