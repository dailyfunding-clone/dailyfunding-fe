"use client";

const AdminModal = ({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) => (
  <div className="modal-backdrop" onClick={onClose}>
    <div className="modal" onClick={(e) => e.stopPropagation()}>
      <h2 className="admin-modal-title">{title}</h2>
      {children}
    </div>
  </div>
);

export default AdminModal;
