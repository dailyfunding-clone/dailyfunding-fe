import { Field } from "@dailyfunding/design-system/components";

import type { Meta, StoryObj } from "@storybook/nextjs";

const meta = {
  title: "Components/Field",
  component: Field,
  argTypes: {
    label: { control: "text" },
    placeholder: { control: "text" },
    type: { control: "radio", options: ["text", "email", "password"] },
  },
  args: { label: "이메일", placeholder: "email@example.com", type: "email" },
  decorators: [
    (Story) => (
      <div style={{ width: 360 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Password: Story = {
  args: {
    label: "비밀번호",
    placeholder: "비밀번호를 입력해 주세요",
    type: "password",
  },
};
