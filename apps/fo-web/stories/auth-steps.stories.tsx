import { Steps } from "@dailyfunding/design-system/components";

import type { Meta, StoryObj } from "@storybook/nextjs";

const items = ["계정 정보", "본인인증"];

const meta = {
  title: "Auth/Steps",
  component: Steps,
  argTypes: {
    current: { control: { type: "range", min: 0, max: 1, step: 1 } },
  },
  args: { items, current: 0 },
  decorators: [
    (Story) => (
      <div style={{ width: 360 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Steps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AccountInfo: Story = {};

export const Verify: Story = { args: { current: 1 } };
