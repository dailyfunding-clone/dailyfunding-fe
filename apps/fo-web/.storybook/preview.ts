import type { Preview } from "@storybook/nextjs";
import "@dailyfunding/design-system/tokens.css";
import "../app/globals.css";

const preview: Preview = {
  parameters: {
    layout: "centered",
    controls: { expanded: true },
  },
};

export default preview;
