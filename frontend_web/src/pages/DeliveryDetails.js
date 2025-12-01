import React from 'react';
import { useParams } from 'react-router-dom';

export default function DeliveryDetails() {
  const { id } = useParams();
  return (
    <div className="container">
      <h1>Delivery Details</h1>
      <p>Delivery ID: {id}</p>
    </div>
  );
}
