import { BookOutlined, PlusOutlined, NumberOutlined } from "@ant-design/icons";
import {
  isNotUndefined,
  TreeMenuNode,
  TreeMenuNodeIcon,
} from "@dendronhq/common-all";
import _ from "lodash";
import { DataNode } from "rc-tree/lib/interface";
import React from "react";

export class TreeViewUtils {
  static treeMenuNode2DataNode({
    roots,
    showVaultName,
    applyNavExclude = false,
  }: {
    roots: TreeMenuNode[];
    showVaultName?: boolean;
    applyNavExclude: boolean;
  }): DataNode[] {
    return roots
      .map((node: TreeMenuNode) => {
        let icon;
        if (node.icon === TreeMenuNodeIcon.bookOutlined) {
          icon = <BookOutlined />;
        } else if (node.icon === TreeMenuNodeIcon.numberOutlined) {
          icon = <NumberOutlined />;
        } else if (node.icon === TreeMenuNodeIcon.plusOutlined) {
          icon = <PlusOutlined />;
        }

        if (applyNavExclude && node.navExclude) {
          return undefined;
        }

        let title: any = node.title;
        if (showVaultName) title = `${title} (${node.vaultName})`;

        if (node.hasTitleNumberOutlined) {
          title = (
            <span>
              <NumberOutlined />
              {title}
            </span>
          );
        }

        return {
          key: node.key,
          title,
          icon,
          children: node.children
            ? TreeViewUtils.treeMenuNode2DataNode({
                roots: node.children,
                showVaultName,
                applyNavExclude,
              })
            : [],
        };
      })
      .filter(isNotUndefined);
  }
}
