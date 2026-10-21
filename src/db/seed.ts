/**
 * Demo data for development, presentations and the viva.
 *
 *   npm run db:seed
 *
 * WARNING: empties every ErHub table first. Never run against production.
 * Runs outside Next.js, so it creates its own connection instead of
 * importing `@/db` (which is server-only).
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';
import type { ApprovalAction, ProjectMemberRole, ProjectStatus, TechnologyCategory } from './schema/enums';

const DEMO_PASSWORD = 'Erhub@2026';

const TABLES = [
  'audit_logs',
  'notifications',
  'approvals',
  'project_revisions',
  'project_images',
  'project_documents',
  'project_technologies',
  'project_members',
  'projects',
  'technologies',
  'users',
  'academic_years',
  'departments',
];

const uuid = () => crypto.randomUUID();
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

async function main() {
  if (process.env.NODE_ENV === 'production') throw new Error('Refusing to seed in production.');
  const pool = mysql.createPool({ uri: process.env.DATABASE_URL!, connectionLimit: 2 });
  const db = drizzle(pool, { schema, mode: 'default' });

  console.log('• Clearing tables');
  await db.execute(sql`SET FOREIGN_KEY_CHECKS = 0`);
  for (const t of TABLES) await db.execute(sql.raw(`TRUNCATE TABLE \`${t}\``));
  await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1`);

  // ─── Departments & years ───────────────────────────────────────────────
  const dept = {
    CSE: { id: uuid(), name: 'Computer Science & Engineering', code: 'CSE', description: 'Software, AI, systems and networks.' },
    ECE: { id: uuid(), name: 'Electronics & Communication Engineering', code: 'ECE', description: 'Embedded systems, VLSI, signal processing and IoT.' },
    ME: { id: uuid(), name: 'Mechanical Engineering', code: 'ME', description: 'Design, robotics, thermal and manufacturing.' },
  };
  await db.insert(schema.departments).values(Object.values(dept));

  const year = {
    prev: { id: uuid(), label: '2025-26', startYear: 2025, isCurrent: false },
    curr: { id: uuid(), label: '2026-27', startYear: 2026, isCurrent: true },
  };
  await db.insert(schema.academicYears).values(Object.values(year));

  // ─── Technologies ──────────────────────────────────────────────────────
  const techList: [string, TechnologyCategory][] = [
    ['Python', 'LANGUAGE'], ['JavaScript', 'LANGUAGE'], ['TypeScript', 'LANGUAGE'], ['C++', 'LANGUAGE'], ['Java', 'LANGUAGE'], ['Kotlin', 'LANGUAGE'], ['C', 'LANGUAGE'],
    ['React', 'FRAMEWORK'], ['Next.js', 'FRAMEWORK'], ['Flutter', 'FRAMEWORK'], ['Django', 'FRAMEWORK'], ['FastAPI', 'FRAMEWORK'], ['Node.js', 'FRAMEWORK'], ['Spring Boot', 'FRAMEWORK'],
    ['MySQL', 'DATABASE'], ['PostgreSQL', 'DATABASE'], ['MongoDB', 'DATABASE'], ['Firebase', 'DATABASE'],
    ['Arduino', 'HARDWARE'], ['Raspberry Pi', 'HARDWARE'], ['ESP32', 'HARDWARE'], ['LoRa', 'HARDWARE'], ['3D Printing', 'HARDWARE'],
    ['TensorFlow', 'AI_ML'], ['PyTorch', 'AI_ML'], ['OpenCV', 'AI_ML'], ['scikit-learn', 'AI_ML'],
    ['Docker', 'TOOL'], ['MATLAB', 'TOOL'], ['SolidWorks', 'TOOL'], ['ANSYS', 'TOOL'], ['AWS', 'CLOUD'],
  ];
  const tech = Object.fromEntries(techList.map(([name, category]) => [name, { id: uuid(), name, slug: slug(name.replace('++', 'pp').replace('.', '')), category }]));
  await db.insert(schema.technologies).values(Object.values(tech));

  // ─── Users ─────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  type SeedUser = typeof schema.users.$inferInsert & { id: string };
  const mk = (u: Omit<SeedUser, 'id' | 'passwordHash'>): SeedUser => ({ id: uuid(), passwordHash, ...u });

  const admin = mk({ name: 'System Administrator', email: 'admin@erhub.dev', username: 'admin-erhub', role: 'ADMIN', departmentId: dept.CSE.id });
  const fac = {
    cse: mk({ name: 'Dr. Meera Nair', email: 'meera@erhub.dev', username: 'meeranair', role: 'FACULTY', departmentId: dept.CSE.id, bio: 'Associate Professor — machine learning and distributed systems.' }),
    cse2: mk({ name: 'Prof. Rahul Menon', email: 'rahul@erhub.dev', username: 'rahulmenon', role: 'FACULTY', departmentId: dept.CSE.id, bio: 'Assistant Professor — web engineering and databases.' }),
    ece: mk({ name: 'Dr. Anitha Joseph', email: 'anitha@erhub.dev', username: 'anithajoseph', role: 'FACULTY', departmentId: dept.ECE.id, bio: 'Professor — embedded systems and IoT.' }),
    me: mk({ name: 'Dr. Thomas Varghese', email: 'thomas@erhub.dev', username: 'thomasvarghese', role: 'FACULTY', departmentId: dept.ME.id, bio: 'Professor — robotics and mechatronics.' }),
  };
  const rep = {
    cse: mk({ name: 'Sneha Pillai', email: 'sneha@erhub.dev', username: 'snehapillai', role: 'REPRESENTATIVE', departmentId: dept.CSE.id, studentIdentifier: 'CSE22R01', graduationYear: 2026 }),
    ece: mk({ name: 'Arjun Das', email: 'arjun@erhub.dev', username: 'arjundas', role: 'REPRESENTATIVE', departmentId: dept.ECE.id, studentIdentifier: 'ECE22R01', graduationYear: 2026 }),
    me: mk({ name: 'Kiran Raj', email: 'kiran@erhub.dev', username: 'kiranraj', role: 'REPRESENTATIVE', departmentId: dept.ME.id, studentIdentifier: 'ME22R01', graduationYear: 2026 }),
  };
  const s = (name: string, username: string, d: keyof typeof dept, id: string, grad: number) =>
    mk({ name, email: `${username}@erhub.dev`, username, role: 'STUDENT', departmentId: dept[d].id, studentIdentifier: id, graduationYear: grad });
  const stu = {
    abin: s('Abin Antony', 'abinantony', 'CSE', 'CSE22001', 2026),
    fathima: s('Fathima Rasheed', 'fathimarasheed', 'CSE', 'CSE22014', 2026),
    nikhil: s('Nikhil Suresh', 'nikhilsuresh', 'CSE', 'CSE22027', 2026),
    diya: s('Diya Mathew', 'diyamathew', 'CSE', 'CSE23005', 2027),
    rohan: s('Rohan George', 'rohangeorge', 'CSE', 'CSE23011', 2027),
    aisha: s('Aisha Khan', 'aishakhan', 'ECE', 'ECE22008', 2026),
    vishnu: s('Vishnu Prasad', 'vishnuprasad', 'ECE', 'ECE22019', 2026),
    anna: s('Anna Thomas', 'annathomas', 'ECE', 'ECE23003', 2027),
    gokul: s('Gokul Krishna', 'gokulkrishna', 'ME', 'ME22012', 2026),
    sara: s('Sara Philip', 'saraphilip', 'ME', 'ME22020', 2026),
    alan: s('Alan Jose', 'alanjose', 'ME', 'ME23007', 2027),
  };
  await db.insert(schema.users).values([admin, ...Object.values(fac), ...Object.values(rep), ...Object.values(stu)]);

  // ─── Projects ──────────────────────────────────────────────────────────
  type SeedProject = {
    title: string;
    abstract: string;
    description?: string;
    dept: keyof typeof dept;
    year: keyof typeof year;
    status: ProjectStatus;
    leader: SeedUser;
    members: [SeedUser, ProjectMemberRole, string][];
    guide?: SeedUser;
    techs: string[];
    github?: string;
    demo?: string;
    views?: number;
    featured?: boolean;
    age: number; // days since creation
    rejectComment?: string;
  };

  const P: SeedProject[] = [
    {
      title: 'Smart Campus Attendance with Face Recognition',
      abstract: 'A contactless attendance system that recognises students from a classroom camera feed in real time, marks attendance automatically and lets faculty review exceptions from a web dashboard. It reduces roll-call time to zero and removes proxy attendance.',
      description: 'The system runs a lightweight face-embedding model on a Raspberry Pi at the classroom entrance. Embeddings are matched against an enrolled gallery and results are pushed to a Django API. Faculty can correct mismatches and export monthly reports.\n\nWe evaluated accuracy under different lighting conditions and achieved 97.4% top-1 accuracy on our 120-student test set.',
      dept: 'CSE', year: 'prev', status: 'APPROVED', leader: stu.abin, guide: fac.cse,
      members: [[stu.fathima, 'DEVELOPER', 'ML pipeline'], [stu.nikhil, 'DESIGNER', 'Dashboard UI']],
      techs: ['Python', 'OpenCV', 'TensorFlow', 'Django', 'Raspberry Pi', 'MySQL'],
      github: 'https://github.com/example/smart-attendance', demo: 'https://example.com/attendance', views: 482, featured: true, age: 220,
    },
    {
      title: 'LoRa-based Flood Early Warning Network',
      abstract: 'Low-power river-level sensor nodes that communicate over LoRa to a gateway and raise SMS alerts for villages downstream when water rises faster than a safe threshold. Designed to run for a full monsoon season on a single battery pack.',
      dept: 'ECE', year: 'prev', status: 'APPROVED', leader: stu.aisha, guide: fac.ece,
      members: [[stu.vishnu, 'DEVELOPER', 'Firmware'], [stu.anna, 'RESEARCHER', 'Field testing']],
      techs: ['ESP32', 'LoRa', 'C++', 'Firebase'],
      github: 'https://github.com/example/flood-warning', views: 356, featured: true, age: 200,
    },
    {
      title: 'Autonomous Line-Following Warehouse Robot',
      abstract: 'A low-cost mobile robot that follows floor markings, reads QR checkpoints and carries loads of up to 15 kg between racks. It demonstrates how small workshops can automate internal logistics without expensive AGVs.',
      dept: 'ME', year: 'prev', status: 'APPROVED', leader: stu.gokul, guide: fac.me,
      members: [[stu.sara, 'DESIGNER', 'Chassis design'], [stu.alan, 'DEVELOPER', 'Control code']],
      techs: ['Arduino', 'SolidWorks', '3D Printing', 'C'],
      views: 298, featured: true, age: 190,
    },
    {
      title: 'Campus Lost & Found Mobile App',
      abstract: 'A Flutter app where students report lost or found items with photos and location pins. Matching suggestions are generated from item descriptions, and the security office can verify hand-overs with a QR code.',
      dept: 'CSE', year: 'curr', status: 'APPROVED', leader: stu.diya,
      members: [[stu.rohan, 'DEVELOPER', 'Backend']],
      techs: ['Flutter', 'Firebase', 'Kotlin'],
      github: 'https://github.com/example/lost-found', views: 141, age: 60,
    },
    {
      title: 'Solar Panel Cleaning Drone Prototype',
      abstract: 'A quadcopter carrying a soft rotating brush and a small water reservoir to clean rooftop solar panels. Efficiency measurements before and after cleaning show an average 18% power gain on dusty panels.',
      dept: 'ME', year: 'curr', status: 'APPROVED', leader: stu.sara,
      members: [[stu.gokul, 'RESEARCHER', 'Efficiency testing']],
      techs: ['ANSYS', 'SolidWorks', 'Arduino'],
      views: 97, age: 45,
    },
    {
      title: 'Exam Seating Arrangement Generator',
      abstract: 'A web tool that generates exam hall seating plans so that students of the same course never sit adjacent. It imports registration lists, respects hall capacities and exports printable PDFs for invigilators.',
      dept: 'CSE', year: 'curr', status: 'UNDER_REVIEW', leader: stu.nikhil, guide: fac.cse2,
      members: [[stu.abin, 'DEVELOPER', 'Algorithm']],
      techs: ['Next.js', 'TypeScript', 'MySQL'],
      github: 'https://github.com/example/seating', age: 20,
    },
    {
      title: 'Wearable Fall Detection Band for the Elderly',
      abstract: 'A wrist band with an IMU that detects falls using a trained classifier and alerts caregivers via a paired phone. Battery life, false-positive rate and response time were evaluated with volunteers.',
      dept: 'ECE', year: 'curr', status: 'SUBMITTED', leader: stu.vishnu,
      members: [[stu.aisha, 'RESEARCHER', 'Data collection']],
      techs: ['ESP32', 'TensorFlow', 'C++'],
      age: 12,
    },
    {
      title: 'Crowd-sourced Pothole Mapping',
      abstract: 'An Android app that uses the phone accelerometer to detect potholes while commuting and plots them on a shared map for the municipality. Duplicate reports are clustered to estimate severity.',
      dept: 'CSE', year: 'curr', status: 'SUBMITTED', leader: stu.rohan,
      members: [[stu.diya, 'DOCUMENTATION', 'Report & slides']],
      techs: ['Kotlin', 'Firebase', 'Python'],
      age: 9,
    },
    {
      title: 'Hydroponic Farm Monitoring Dashboard',
      abstract: 'Sensors track pH, EC and water temperature in a hydroponic setup and stream readings to a dashboard with alerts and dosing recommendations for growers.',
      dept: 'ECE', year: 'curr', status: 'REJECTED', leader: stu.anna,
      members: [[stu.vishnu, 'DEVELOPER', 'Sensors']],
      techs: ['Raspberry Pi', 'Python', 'React'],
      age: 30, rejectComment: 'Please add the calibration procedure for the pH sensor and include test results from at least two weeks of operation.',
    },
    {
      title: 'Regenerative Braking Kit for Bicycles',
      abstract: 'A bolt-on hub generator and supercapacitor bank that recovers energy while braking and powers lights and a phone charger. Includes a cost analysis for mass production.',
      dept: 'ME', year: 'curr', status: 'DRAFT', leader: stu.alan,
      members: [],
      techs: ['MATLAB'],
      age: 5,
    },
    {
      title: 'Library Book Recommendation Engine',
      abstract: 'A recommendation service for the college library that suggests books based on borrowing history and course syllabi, built as an API the library portal can call.',
      dept: 'CSE', year: 'curr', status: 'DRAFT', leader: stu.fathima,
      members: [[stu.nikhil, 'DEVELOPER', 'API']],
      techs: ['Python', 'scikit-learn', 'FastAPI'],
      age: 3,
    },
    {
      title: 'Legacy Notice Board Display',
      abstract: 'An older digital notice board project that has been superseded by the new campus display system. Kept in the archive for reference by future batches working on signage.',
      dept: 'ECE', year: 'prev', status: 'ARCHIVED', leader: stu.aisha,
      members: [],
      techs: ['Raspberry Pi', 'JavaScript'],
      age: 300,
    },
  ];

  const approvalRows: (typeof schema.approvals.$inferInsert)[] = [];
  const reviewerFor = (d: keyof typeof dept) => ({ rep: rep[d.toLowerCase() as 'cse' | 'ece' | 'me'], fac: fac[d.toLowerCase() as 'cse' | 'ece' | 'me'] });

  for (const p of P) {
    const id = uuid();
    const created = daysAgo(p.age);
    const submitted = daysAgo(p.age - 2);
    const approved = daysAgo(Math.max(p.age - 7, 1));
    const reached = (s: ProjectStatus) => ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'ARCHIVED'].includes(s);

    await db.insert(schema.projects).values({
      id,
      title: p.title,
      slug: `${slug(p.title).slice(0, 80)}-${id.slice(0, 6)}`,
      abstract: p.abstract,
      description: p.description ?? null,
      departmentId: dept[p.dept].id,
      academicYearId: year[p.year].id,
      status: p.status,
      leaderId: p.leader.id,
      guideId: p.guide?.id ?? null,
      githubUrl: p.github ?? null,
      demoUrl: p.demo ?? null,
      viewsCount: p.views ?? 0,
      isFeatured: p.featured ?? false,
      submittedAt: reached(p.status) ? submitted : null,
      approvedAt: p.status === 'APPROVED' ? approved : null,
      createdAt: created,
    });
    await db.insert(schema.projectMembers).values([
      { projectId: id, userId: p.leader.id, role: 'LEADER', roleTitle: 'Team lead', createdAt: created },
      ...p.members.map(([u, role, title]) => ({ projectId: id, userId: u.id, role, roleTitle: title, createdAt: created })),
    ]);
    await db.insert(schema.projectTechnologies).values(p.techs.map((t) => ({ projectId: id, technologyId: tech[t]!.id })));

    // Timeline consistent with the final status.
    const r = reviewerFor(p.dept);
    const step = (action: ApprovalAction, actor: SeedUser, from: string, to: string, at: Date, comment?: string) =>
      approvalRows.push({ projectId: id, actorId: actor.id, action, fromStatus: from, toStatus: to, comment: comment ?? null, createdAt: at });

    if (reached(p.status)) step('SUBMIT', p.leader, 'DRAFT', 'SUBMITTED', submitted);
    if (['UNDER_REVIEW', 'APPROVED', 'ARCHIVED'].includes(p.status)) step('FORWARD', r.rep, 'SUBMITTED', 'UNDER_REVIEW', daysAgo(p.age - 4), 'Complete submission — forwarding to faculty.');
    if (p.status === 'APPROVED' || p.status === 'ARCHIVED') step('APPROVE', p.guide ?? r.fac, 'UNDER_REVIEW', 'APPROVED', approved, 'Well documented. Approved for the repository.');
    if (p.status === 'ARCHIVED') step('ARCHIVE', admin, 'APPROVED', 'ARCHIVED', daysAgo(10), 'Superseded by a newer project.');
    if (p.status === 'REJECTED') step('REJECT', r.rep, 'SUBMITTED', 'REJECTED', daysAgo(p.age - 5), p.rejectComment);
  }
  await db.insert(schema.approvals).values(approvalRows);

  // A few notifications so the bell is not empty in demos.
  await db.insert(schema.notifications).values([
    { userId: stu.abin.id, type: 'project.approved', title: 'Project approved 🎉', message: '"Smart Campus Attendance with Face Recognition" is now published in the repository.', link: '/projects', isRead: true },
    { userId: stu.anna.id, type: 'project.rejected', title: 'Changes requested', message: 'Please add the calibration procedure for the pH sensor.', link: '/dashboard/projects' },
    { userId: rep.cse.id, type: 'project.submitted', title: 'New project to screen', message: '"Crowd-sourced Pothole Mapping" is waiting for screening.', link: '/dashboard/reviews' },
    { userId: fac.cse2.id, type: 'project.forwarded', title: 'Project ready for final review', message: '"Exam Seating Arrangement Generator" passed screening.', link: '/dashboard/reviews' },
  ]);

  await pool.end();
  console.log(`✓ Seeded ${P.length} projects, ${techList.length} technologies, ${1 + Object.keys(fac).length + Object.keys(rep).length + Object.keys(stu).length} users.`);
  console.log('\nDemo accounts (password for all: %s)', DEMO_PASSWORD);
  console.table([
    { role: 'Admin', email: admin.email },
    { role: 'Faculty (CSE)', email: fac.cse.email },
    { role: 'Faculty (CSE, guide)', email: fac.cse2.email },
    { role: 'Representative (CSE)', email: rep.cse.email },
    { role: 'Student (CSE)', email: stu.abin.email },
    { role: 'Student (ECE)', email: stu.anna.email },
  ]);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
