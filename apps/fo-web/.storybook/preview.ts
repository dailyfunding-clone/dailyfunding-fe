import type { Preview } from "@storybook/nextjs";
import "@dailyfunding/design-system/tokens.css";
import "../src/app/globals.scss";

const preview: Preview = {
  parameters: {
    layout: "centered",
    controls: { expanded: true },
  },
};

export default preview;
