import React, { useEffect, useState } from "react";
import { Card, Badge, ListGroup, Spinner, Form, Row, Col, Button } from "react-bootstrap";
import { FiDollarSign, FiTrendingUp, FiBarChart2, FiUsers } from "react-icons/fi";
import { getAnalyticsfilter } from "../config/api";

function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Get current month name and year
  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleString("default", { month: "long" }); // e.g., "October"
  const currentYear = currentDate.getFullYear();

  // Default filters = current month/year
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);
  const [refresh, setRefresh] = useState(false);

  // Month and year options
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const params = { month, year }; // always include current month/year
        const res = await getAnalyticsfilter(params);
        setAnalytics(res.data);

      } catch (err) {
        console.error("Failed to load analytics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [refresh]); // re-fetch when user applies filters

  const handleFilter = () => {
    setRefresh((prev) => !prev);
  };

  if (loading)
    return (
      <div className="p-4 text-center">
        <Spinner animation="border" />
      </div>
    );

  const items = analytics?.topItems || [];

  return (
    <div className="py-4">
      <h3 className="mb-1  fw-bold">Analytics & Reports</h3>


      <Card className="mb-4 border-0 p-3">
        <Form>
          <Row className="g-2 justify-content-end align-items-end">
            <Col xs={6} sm="auto">
              <Form.Group controlId="filterMonth" className="mb-0">
                <Form.Label className="fw-semibold small text-muted mb-1">Month</Form.Label>
                <Form.Select
                  size="sm"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                >
                  {months.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col xs={6} sm="auto">
              <Form.Group controlId="filterYear" className="mb-0">
                <Form.Label className="fw-semibold small text-muted mb-1">Year</Form.Label>
                <Form.Select
                  size="sm"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col xs={12} sm="auto">
              <Button
                variant="primary"
                size="sm"
                onClick={handleFilter}
                className="mt-2 mt-sm-0 px-3"
              >
                Apply
              </Button>
            </Col>
          </Row>
        </Form>
      </Card>


      {/* Top Stats */}
      <div className="d-flex flex-wrap gap-3 mb-4">
        <Card className="shadow-sm flex-fill" style={{ minWidth: "220px" }}>
          <Card.Body className="d-flex justify-content-between align-items-center">
            <div>
              <h6 className="fw-medium">Total Revenue</h6>
              <h4 className="fw-bold text-success">
                ₹{analytics?.totalRevenue || "0.00"}
              </h4>
            </div>
            <FiDollarSign size={28} className="text-success" />
          </Card.Body>
        </Card>

        <Card className="shadow-sm flex-fill" style={{ minWidth: "220px" }}>
          <Card.Body className="d-flex justify-content-between align-items-center">
            <div>
              <h6 className="fw-medium">Orders Monthly</h6>
              <h4 className="fw-bold text-primary">
                {analytics?.monthlyBills || 0}
              </h4>
            </div>
            <FiUsers className="fs-3 text-primary" />
          </Card.Body>
        </Card>

        <Card className="shadow-sm flex-fill" style={{ minWidth: "220px" }}>
          <Card.Body className="d-flex justify-content-between align-items-center">
            <div>
              <h6 className="fw-medium">Avg Order Value</h6>
              <h4 className="fw-bold text-success">
                ₹{analytics?.monthlyAvgOrderValue || "0.00"}
              </h4>
            </div>
            <FiTrendingUp size={28} className="text-success" />
          </Card.Body>
        </Card>

        <Card className="shadow-sm flex-fill" style={{ minWidth: "220px" }}>
          <Card.Body className="d-flex justify-content-between align-items-center">
            <div>
              <h6 className="fw-medium">Completion Rate</h6>
              <h4 className="fw-bold text-primary">
                {analytics?.monthlyCompletionRate || "0%"}
              </h4>
            </div>
            <FiBarChart2 size={28} className="text-primary" />
          </Card.Body>
        </Card>
      </div>

      {/* Popular Items */}
      <Card className="shadow-sm">
        <Card.Body>
          <h6 className="fw-bold mb-3">Popular Menu Items</h6>
          <ListGroup variant="flush">
            {items.length > 0 ? (
              items.map((item, idx) => (
                <ListGroup.Item
                  key={item._id}
                  className="d-flex justify-content-between align-items-center"
                >
                  <div>
                    <span className="fw-bold">{idx + 1}. </span>
                    {item.name}
                  </div>
                  <Badge bg="secondary">{item.totalQuantity} sold</Badge>
                </ListGroup.Item>
              ))
            ) : (
              <ListGroup.Item className="text-center fw-medium">
                No popular items yet.
              </ListGroup.Item>
            )}
          </ListGroup>
        </Card.Body>
      </Card>
    </div>
  );
}

export default AnalyticsDashboard;
