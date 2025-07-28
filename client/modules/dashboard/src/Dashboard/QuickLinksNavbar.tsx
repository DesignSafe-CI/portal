import { Typography, Space } from 'antd';
import FavoriteTools from './FavoriteTools';

const { Title, Link } = Typography;

const Quicklinks = () => {
  return (
    <div style={{ padding: '16px' }}>
      <Title level={4}>Quick Links</Title>
      <Space
        direction="vertical"
        size="middle"
        style={{ display: 'flex', marginTop: 16 }}
      >
        <FavoriteTools />
        <Link href="/account">Manage Account</Link>
        <Link href="/workspace">Tools & Applications</Link>
        <Link href="/learning-center/overview">Training</Link>
      </Space>
    </div>
  );
};

export default Quicklinks;
