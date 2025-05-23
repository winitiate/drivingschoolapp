import React, { useState } from 'react';
import {
  IconButton,
  Menu,
  MenuItem
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { Link as RouterLink } from 'react-router-dom';

export interface NavItem {
  label: string;
  to?: string;
  action?: () => void;
}

export default function NavMenu({ items }: { items: NavItem[] }) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  // Deduplicate by label+to
  const navItems = items.filter((item, idx, arr) =>
    arr.findIndex(
      oth => oth.label === item.label && oth.to === item.to
    ) === idx
  );

  return (
    <>
      <IconButton edge="start" color="inherit" onClick={handleOpen}>
        <MenuIcon />
      </IconButton>

      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        {navItems.map(({ label, to, action }) =>
          to ? (
            <MenuItem
              key={to + label}
              component={RouterLink}
              to={to}
              onClick={handleClose}
            >
              {label}
            </MenuItem>
          ) : (
            <MenuItem
              key={label}
              onClick={() => {
                handleClose();
                action?.();
              }}
            >
              {label}
            </MenuItem>
          )
        )}
      </Menu>
    </>
  );
}
