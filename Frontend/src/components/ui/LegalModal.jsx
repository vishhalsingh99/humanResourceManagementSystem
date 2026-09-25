import Modal from './Modal';

const content = {
  terms: {
    title: 'Terms and Conditions',
    sections: [
      {
        heading: 'Acceptance of Terms',
        body: 'By accessing and using Hrms, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use this system.',
      },
      {
        heading: 'Use of the System',
        body: 'Hrms is intended for authorized HR staff only. You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account.',
      },
      {
        heading: 'Employee Data',
        body: 'All employee information entered into the system must be accurate and up to date. Misuse, unauthorized access, or sharing of employee data is strictly prohibited and may result in legal action.',
      },
      {
        heading: 'System Availability',
        body: 'We strive to keep Hrms available at all times, but we do not guarantee uninterrupted access. Scheduled maintenance or unforeseen issues may cause temporary downtime.',
      },
      {
        heading: 'Modifications',
        body: 'We reserve the right to update these Terms at any time. Continued use of the system after changes are posted constitutes your acceptance of the revised Terms.',
      },
      {
        heading: 'Contact',
        body: 'For questions regarding these Terms, please contact your HR administrator.',
      },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    sections: [
      {
        heading: 'Information We Collect',
        body: 'We collect information you provide directly, including names, contact details, and  records entered into the system for Hrms management purposes.',
      },
      {
        heading: 'How We Use Your Information',
        body: 'Collected data is used solely to operate and improve Hrms. We do not sell, trade, or share your information with third parties except as required by law.',
      },
      {
        heading: 'Data Security',
        body: 'We implement industry-standard security measures to protect your data. All data is stored securely and access is restricted to authorized personnel only.',
      },
      {
        heading: 'Data Retention',
        body: 'Employee and clinic data is retained for as long as necessary to provide our services or as required by applicable healthcare regulations.',
      },
      {
        heading: 'Your Rights',
        body: 'You have the right to access, correct, or request deletion of your personal data. To exercise these rights, contact your HR administrator.',
      },
      {
        heading: 'Cookies',
        body: 'Hrms uses minimal session-based storage to keep you logged in. No third-party tracking cookies are used.',
      },
    ],
  },
};

export default function LegalModal({ type, onClose }) {
  const { title, sections } = content[type];

  return (
    <Modal title={title} onClose={onClose}>
      <div className="flex flex-col gap-5">
        {sections.map((s) => (
          <div key={s.heading}>
            <h4 className="text-sm font-medium t-text-heading mb-1">{s.heading}</h4>
            <p className="text-sm t-text-muted leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>
    </Modal>
  );
}
