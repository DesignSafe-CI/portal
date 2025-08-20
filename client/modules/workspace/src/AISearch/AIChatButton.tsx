import { Button, Drawer } from 'antd';
import { useState } from 'react';
import { AIChat } from './AIChat';
import styles from './AIChatButton.module.css';

export const AIChatButton: React.FC = () => {
  const [showDrawer, setShowDrawer] = useState(false);

  return (
    <>
      <Button
        type="default"
        onClick={() => setShowDrawer(true)}
        className={styles.aiButton}
      >
        <b>
          <i className="fa fa-lightbulb-o" /> Ask AI
        </b>
      </Button>

      <Drawer
        title="Ask AI"
        placement="bottom"
        height={600}
        open={showDrawer}
        onClose={() => setShowDrawer(false)}
        maskClosable={true}
      >
        <AIChat closed={!showDrawer} />
      </Drawer>
    </>
  );
};
