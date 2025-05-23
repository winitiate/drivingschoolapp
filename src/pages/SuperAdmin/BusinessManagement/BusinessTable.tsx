// src/pages/SuperAdmin/components/Businesses/BusinessTable.tsx
import React from 'react';
import { Table, TableHead, TableRow, TableCell, TableBody, Button } from '@mui/material';
import { Business } from '../../../../models/Business';

interface Props {
  businesses: Business[];
  onEdit: (business: Business) => void;
}

export default function BusinessTable({ businesses, onEdit }: Props) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Name</TableCell>
          <TableCell>Email</TableCell>
          <TableCell>Phone</TableCell>
          <TableCell align="center">Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {businesses.map(biz => (
          <TableRow key={biz.id}>
            <TableCell>{biz.name}</TableCell>
            <TableCell>{biz.email}</TableCell>
            <TableCell>{biz.phone}</TableCell>
            <TableCell align="center">
              <Button size="small" onClick={() => onEdit(biz)}>Edit</Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
