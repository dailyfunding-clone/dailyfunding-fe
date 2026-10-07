import { Button } from "@dailyfunding/design-system/components";

import type { Meta, StoryObj } from "@storybook/nextjs";

const meta = {
  title: "Components/Button",
  component: Button,
  argTypes: {
    variant: { control: "radio", options: ["primary", "outline"] },
    children: { control: "text" },
    disabled: { control: "boolean" },
  },
  args: { variant: "primary", children: "다음" },
  decorators: [
    (Story) => (
      <div style={{ width: 360 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const Outline: Story = {
  args: { variant: "outline", children: "가입하기" },
};

export const Disabled: Story = {
  args: { disabled: true, children: "로그인" },
};
