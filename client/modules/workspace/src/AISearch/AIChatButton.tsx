import { Button, Drawer } from 'antd';
import { useState } from 'react';
import { AIChat } from './AIChat';
import styles from './AIChatButton.module.css';

export const AIChatButton: React.FC = () => {
  const [showDrawer, setShowDrawer] = useState(false);

  return (
    <div id="nav-ai-root">
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
            <div className={styles['drawer-subtitle']}>
              Beta - This model is still in training. It searches DesignSafe
              Published Data and User Documentation only.
            </div>
          </div>
        }
        placement="bottom"
        height={600}
        open={showDrawer}
        onClose={() => setShowDrawer(false)}
        maskClosable={true}
        rootClassName={styles.drawer}
      >
        <AIChat closed={!showDrawer} />
      </Drawer>
    </div>
  );
};
