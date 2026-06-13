import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

export default defineConfig({
  integrations: [
    starlight({
      title: "Taiko Documentation",
      favicon: "/assets/images/taiko_favicon.ico",
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/getgauge/taiko",
        },
      ],
      sidebar: [
        {
          label: "Introductory",
          items: [
            { label: "Overview", slug: "overview" },
            { label: "Installing", slug: "installing" },
            { label: "Record and run tests", slug: "record-and-run-tests" },
            { label: "API Reference", slug: "api/reference" },
            {
              label: "Frequently asked questions",
              slug: "frequently-asked-questions",
            },
            { label: "Getting Help", slug: "getting-help" },
          ],
        },
        {
          label: "Intermediate",
          items: [
            { label: "Taking Screenshots", slug: "taking-screenshots" },
            { label: "Assertions", slug: "assertions" },
            {
              label: "File Upload and Download",
              slug: "file-upload-and-download",
            },
            {
              label: "Working with element lists",
              slug: "working-with-element-lists",
            },
            {
              label: "Integrating with test runners",
              slug: "integrating-with-test-runners",
            },
            { label: "Configuring Taiko", slug: "configuring-taiko" },
            { label: "Plugins", slug: "plugins" },
          ],
        },
        {
          label: "Advanced",
          items: [
            {
              label: "Running scripts inside the browser",
              slug: "running-scripts-inside-the-browser",
            },
            { label: "Taiko in Docker", slug: "taiko-in-docker" },
            { label: "Writing plugins", slug: "writing-plugins" },
            {
              label: "Experimental Features",
              slug: "experimental-features",
            },
            { label: "Contributing", slug: "contributing" },
          ],
        },
        {
          label: "API Reference",
          autogenerate: { directory: "api" },
        },
      ],
    }),
  ],
});
