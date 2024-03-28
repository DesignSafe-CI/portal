import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Layout } from 'antd';
import { AppsSideNav, JobStatusNav, AppsBreadcrumb } from '@client/workspace';
import styles from './layout.module.css'

const { Sider } = Layout;

const WorkspaceRoot: React.FC = () => {
  type Breadcrumb = {
    title: string;
    path?: string;
  };

  const { pathname } = useLocation();
  console.log(pathname);
  const initialBreadcrumbs: Breadcrumb[] = [
    { title: 'Home', path: 'home' },
    { title: 'Use DesignSafe' },
    { title: 'Tools & Applications', path: '/' }
  ];

  return (
    <>
    <div className={styles.breadcrumbWrapper}>
      <AppsBreadcrumb 
          initialBreadcrumbs={initialBreadcrumbs.map(breadcrumb => ({ ...breadcrumb, path: breadcrumb.path ?? '' }))}
          path={pathname ?? ''}
          baseRoute={``}
          systemRootAlias={``} 
          systemRoot={``}
          itemRender={(obj) => {
            if (!obj.path) {
              return <span className="breadcrumb-text">{obj.title}</span>;
            }
            return (
              <Link className="breadcrumb-link" to={obj.path}>
                  {obj.title}
              </Link>
            );            
          }}
       />
       </div>
      <Layout
        hasSider
        className={styles.layoutContainer}
      >
        <Sider width={200} theme="light" breakpoint="md" collapsedWidth={0}>
          <h1 className="headline headline-research" id="headline-data-depot">
            <span className="hl hl-research">Tools and Applications</span>
          </h1>
          <JobStatusNav />
          <AppsSideNav />
        </Sider>
        <Outlet />
      </Layout>
    </>
  );
};

export default WorkspaceRoot;
