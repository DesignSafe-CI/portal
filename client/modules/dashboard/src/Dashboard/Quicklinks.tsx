import React from 'react';
import styles from './dashboard.module.css';
import { MdManageAccounts, MdCastForEducation } from "react-icons/md";
import { TbDatabaseShare } from "react-icons/tb";
import { IoIosApps } from "react-icons/io";
import { FaMapMarkedAlt } from "react-icons/fa";
const Quicklinks = () => {
  return (
    <div className={styles.sidebar}>
      <div className={styles.sidebarTitle}>Quick Links</div>
      <a href="/account" className={styles.sidebarLink}><MdManageAccounts className={styles.sidebarIcon}/>Manage Account</a>
      <a href="/data/browser" className={styles.sidebarLink}><TbDatabaseShare className={styles.sidebarIcon}/>Data Depot</a>
      <a href="/workspace" className={styles.sidebarLink}><IoIosApps className={styles.sidebarIcon}/>Tools & Applications</a>
      <a href="/recon-portal" className={styles.sidebarLink}><FaMapMarkedAlt className={styles.sidebarIcon}/>Recon Portal</a>
      <a href="/learning-center/overview" className={styles.sidebarLink}><MdCastForEducation className={styles.sidebarIcon}/>Training</a>
    </div>
  );
};

export default Quicklinks;
