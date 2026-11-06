import { Button, Drawer } from 'antd';
import { useRef, useState } from 'react';
import type { Sender } from '@ant-design/x';
import { AIChat } from './AIChat';
import styles from './AIChatButton.module.css';

export const AIChatButton: React.FC = () => {
  const [showDrawer, setShowDrawer] = useState(false);
  const senderRef = useRef<React.ElementRef<typeof Sender>>(null);

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
            <div className={styles['drawer-title']}>Ask AI</div>
            <div className={styles['drawer-subtitle']}>
              Beta - This model is still in training. It searches DesignSafe
              Published Data and User Documentation only.
            </div>
          </div>
        }
        placement="bottom"
        height="var(--ai-chat-drawer-height)"
        open={showDrawer}
        afterOpenChange={(open) => {
          if (open) senderRef.current?.focus();
        }}
        onClose={() => setShowDrawer(false)}
        maskClosable={true}
        rootClassName={styles.drawer}
      >
        <AIChat closed={!showDrawer} senderRef={senderRef} />
      </Drawer>
    </div>
  );
};
