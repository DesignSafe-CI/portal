import React from "react";
import { TUserUsage } from "@client/hooks"
import { toBytes } from "@client/common-components"
import styles from "../Dashboard/Dashboard.module.css"

export const UsageGraphic = ({ userUsage }: { userUsage: TUserUsage | undefined}) => {
    return (
        <div className="col-sm-6">
        <div className={`${styles['dashboard-stat']} ${styles.red}`}>
            <div className={styles.visual}>
                <i role="none" className="fa fa-database"></i>
            </div>
            <div className={styles.details}>
                <div className={styles.number}> {toBytes(userUsage?.total_storage_bytes)} </div>
                <div className={styles.desc}> Data Stored </div>
            </div>
        </div>
    </div>
    )
}