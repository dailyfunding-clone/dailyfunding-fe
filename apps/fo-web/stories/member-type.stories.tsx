import type { Meta, StoryObj } from "@storybook/nextjs";

const MemberTypeSelect = () => (
  <div className="member-types">
    <button type="button" className="member-type">
      <span className="member-type-name">개인</span>
      <span className="member-type-desc">이메일로 바로 가입해요</span>
    </button>
    <button type="button" className="member-type">
      <span className="member-type-name">법인</span>
      <span className="member-type-desc">사업자등록증이 필요해요</span>
    </button>
  </div>
);

const meta = {
  title: "Auth/MemberTypeSelect",
  component: MemberTypeSelect,
  decorators: [
    (Story) => (
      <div style={{ width: 360 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MemberTypeSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
