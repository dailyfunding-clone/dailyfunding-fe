import { AppLink } from "@/shared/ui";

const NotFound = () => (
  <main className="container">
    <div className="gate">
      <p>페이지를 찾을 수 없어요</p>
      <AppLink href="/" className="btn btn-primary">
        홈으로 가기
      </AppLink>
    </div>
  </main>
);

export default NotFound;
