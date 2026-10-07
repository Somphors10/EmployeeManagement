export const mockAttendance = {
  present: 18,
  late: 2,
  absent: 1,
  onLeave: 3,
  records: [
    { id: 1, name: 'Som Phors', role: 'Software Engineer', date: '2026-10-07', in: '08:02', out: '17:11', status: 'Present' },
    { id: 2, name: 'Aria Chen', role: 'Product Designer', date: '2026-10-07', in: '09:18', out: '17:40', status: 'Late' },
    { id: 3, name: 'Dara Kim', role: 'QA Engineer', date: '2026-10-07', in: '—', out: '—', status: 'Leave' },
    { id: 4, name: 'Vannak Meas', role: 'Department Manager', date: '2026-10-07', in: '07:55', out: '18:02', status: 'Present' },
    { id: 5, name: 'Lina Sok', role: 'HR Officer', date: '2026-10-07', in: '—', out: '—', status: 'Absent' },
  ],
  week: [
    { day: 'Mon', date: '05', status: 'Present' },
    { day: 'Tue', date: '06', status: 'Present' },
    { day: 'Wed', date: '07', status: 'Late' },
    { day: 'Thu', date: '08', status: 'Present' },
    { day: 'Fri', date: '09', status: 'Leave' },
    { day: 'Sat', date: '10', status: 'Off' },
    { day: 'Sun', date: '11', status: 'Off' },
  ],
};

export const mockPayroll = [
  { id: 1, name: 'Som Phors', role: 'Software Engineer', base: 1200, allowance: 150, deduct: 40, net: 1310, month: 'October 2026', status: 'Paid' },
  { id: 2, name: 'Aria Chen', role: 'Product Designer', base: 1100, allowance: 120, deduct: 35, net: 1185, month: 'October 2026', status: 'Paid' },
  { id: 3, name: 'Dara Kim', role: 'QA Engineer', base: 900, allowance: 80, deduct: 20, net: 960, month: 'October 2026', status: 'Pending' },
  { id: 4, name: 'Vannak Meas', role: 'Department Manager', base: 1600, allowance: 200, deduct: 60, net: 1740, month: 'October 2026', status: 'Paid' },
];

export const mockDocuments = [
  { id: 1, name: 'Employment contract', owner: 'Som Phors', type: 'Contract', updated: '12 Sep 2026' },
  { id: 2, name: 'National ID copy', owner: 'Aria Chen', type: 'Identity', updated: '03 Aug 2026' },
  { id: 3, name: 'Degree certificate', owner: 'Dara Kim', type: 'Education', updated: '21 Jul 2026' },
  { id: 4, name: 'Offer letter', owner: 'Lina Sok', type: 'Contract', updated: '02 Oct 2026' },
];

export const mockReviews = [
  { id: 1, name: 'Som Phors', role: 'Software Engineer', score: 4.6, cycle: 'Q3 2026', status: 'Completed', note: 'Strong delivery and mentoring.' },
  { id: 2, name: 'Aria Chen', role: 'Product Designer', score: 4.2, cycle: 'Q3 2026', status: 'Completed', note: 'Clear design system work.' },
  { id: 3, name: 'Dara Kim', role: 'QA Engineer', score: 3.8, cycle: 'Q3 2026', status: 'In review', note: 'Needs more automation coverage.' },
];

export const mockAnnouncements = [
  { id: 1, title: 'Office closed on Pchum Ben', date: '18 Oct 2026', body: 'The office will be closed Friday. Submit leave only if you need extra days around the holiday.' },
  { id: 2, title: 'New payroll cutoff', date: '10 Oct 2026', body: 'Timesheets must be confirmed by the 25th so finance can process salary on time.' },
  { id: 3, title: 'Welcome Lina Sok', date: '02 Oct 2026', body: 'Lina joins HR as People Operations Officer. Please help her settle in.' },
];

export const mockHolidays = [
  { id: 1, name: 'Pchum Ben', date: '18 Oct 2026' },
  { id: 2, name: 'Independence Day', date: '9 Nov 2026' },
  { id: 3, name: 'Water Festival', date: '24 Nov 2026' },
];

export const mockOrg = [
  { id: 'ceo', name: 'Vannak Meas', role: 'Department Manager', reports: ['eng', 'design'] },
  { id: 'eng', name: 'Som Phors', role: 'Software Engineer', reports: ['qa'] },
  { id: 'design', name: 'Aria Chen', role: 'Product Designer', reports: [] },
  { id: 'qa', name: 'Dara Kim', role: 'QA Engineer', reports: [] },
];
