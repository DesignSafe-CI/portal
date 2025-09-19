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
          <i className="fa fa-lightbulb-o" /> Ask AI (Beta)
        </b>
      </Button>

      <Drawer
        title={
          <div>
            <div>Ask AI</div>
            <div style={{ fontSize: '11px', fontWeight: 'normal', color: 'gray' }}>
              Beta - This model is still in training. It searches Published Data and User Documentation only.
            </div>
          </div>
        }
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
