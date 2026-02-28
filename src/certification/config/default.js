/**
 * Certification Module — Default Configuration
 * 
 * All certification text, skills, company info, and personal data fields
 * are configured here. Edit this file to customize any certification for
 * a different project, company, or domain.
 */

const defaultConfig = {
    /* ──────── Issuing Organization ──────── */
    company: {
        name:       'NLarchive',
        department: 'Department of Digital Logic & Computer Architecture',
        logoEmoji:  '⚡',          // Used in the seal; replace with URL for image logo
        sealText:   'Verified',     // Text inside the official seal
    },

    /* ──────── Certificate Copy ──────── */
    certificate: {
        title:    'Certificate',
        watermark: 'NLarchive',
        baseName: 'NLarchive Certificate in Digital Logic Fundamentals',
    },

    /* ──────── Tier Definitions ──────── */
    tiers: {
        'in-progress': {
            label:       'Certificate Program In Progress',
            description: 'pursuing certification in digital logic, sequential systems, and processor architecture fundamentals',
            topicsCovered: 'signal flow, transistor switching, logic gates, arithmetic building blocks, sequential state, and introductory CPU datapath concepts',
            badgeClass:  'in-progress',
        },
        simple: {
            label:       'Foundation Certificate in Logic Gates',
            description: 'having demonstrated understanding of the full foundation track across digital logic, sequential design, and introductory architecture at the Foundation level',
            topicsCovered: 'wires and transistor switching, Boolean logic and universal gates, MUX/decoder basics, adders, latches and flip-flops, counters and FSM basics, and simple ALU/microprocessor core construction',
            badgeClass:  'simple',
        },
        intermediate: {
            label:       'Intermediate Certificate in Circuit Design',
            description: 'having demonstrated proficiency in intermediate combinational and sequential circuit design at the Intermediate level',
            topicsCovered: 'bus and fan-out structures, NAND/NOR synthesis, XNOR and parity/equality logic, enabled decoders, subtractor design, gated storage elements, frequency division, Gray/ring counters, and 1-bit ALU/instruction decode design',
            badgeClass:  'intermediate',
        },
        advanced: {
            label:       'Advanced Certificate in Digital Logic Engineering',
            description: 'having demonstrated mastery of advanced digital logic engineering across formal synthesis, timing-aware sequential systems, and datapath integration at the Advanced level',
            topicsCovered: 'AOI transistor-level composition, majority logic, universality proofs, NAND-only XOR realization, high-order De Morgan transformations, hierarchical MUX composition, priority encoding, ripple-carry scaling, JK and synchronous counter design, sequence detection, comparator design, and 2-stage CPU pipeline integration',
            badgeClass:  'advanced',
        },
        expert: {
            label:       'Expert Certificate in Computer Architecture',
            description: 'having demonstrated expert-level mastery of computer architecture, hazard-aware design, register file construction, and pipelined processor engineering at the Expert level',
            topicsCovered: 'crossbar routing, transistor cascade networks, inhibit logic, material implication, static hazard elimination with consensus terms, NAND-only full adder synthesis, 8:1 MUX tree composition, register file cells with read/write control, loadable toggle counters, binary-to-Gray conversion, Boolean minimization, 7-segment decoding, NOR-only XOR, binary multiplication, shift registers, bidirectional counters, modulo-N FSMs, signed overflow detection, and 3-stage pipelined CPU with hazard stall',
            badgeClass:  'expert',
        },
    },

    /* ──────── Skills & Knowledge Domain (LinkedIn-friendly) ──────── */
    skills: [
        'Transistor-Level Switching Logic',
        'Digital Logic Design',
        'Boolean Algebra',
        'Combinational Circuits',
        'Sequential Circuit Design',
        'Finite State Machine (FSM) Design',
        'Multiplexer and Decoder Design',
        'Adder/Subtractor and ALU Design',
        'Counter and Register Design',
        'Instruction Decode and CPU Datapath Basics',
        'Pipeline Hazard Detection and Stall Logic',
        'Register File Architecture',
        'Circuit Simulation',
        'Computer Architecture Fundamentals',
    ],

    /* ──────── Titles & Honors ──────── */
    honorLabels: {
        intermediateSolver:  'Intermediate Circuit Specialist',
        advancedEngineer:    'Advanced Logic Engineer',
        expertArchitect:     'Expert Computer Architect',
        fullCurriculum:      'Complete Curriculum Mastery',
        foundationHintless:  'Foundation Tier — Independent Achiever',
        intermediateHintless:'Intermediate Tier — Independent Achiever',
        advancedHintless:    'Advanced Tier — Independent Achiever',
        expertHintless:      'Expert Tier — Independent Achiever',
        summaCumLaude:       'Summa Cum Laude — Hintless Master',
        guidedPath:          'Guided Learning Path',
        highestDistinction:  'Highest Distinction',
        withDistinction:     'With Distinction',
        withMerit:           'With Merit',
        withHonors:          'With Honors',
    },

    /* ──────── Score Weights ──────── */
    scoring: {
        xpWeight:    0.45,
        starsWeight: 0.45,
        hintWeight:  0.10,
    },

    /* ──────── Recipient Default ──────── */
    recipient: {
        defaultName: 'Certificate Recipient',
        nameStorageKey: 'certification_recipientName',
    },

    /* ──────── Share Text Templates ──────── */
    share: {
        hashtags: '#NLarchive #DigitalLogic #CircuitDesign #ComputerArchitecture',
        inProgressTemplate: (score) =>
            `📚 Currently pursuing my NLarchive certification in digital logic fundamentals. Progress: ${score}% complete.`,
        completedTemplate: (label) =>
            `I earned the ${label} from NLarchive!`,
    },

    /* ──────── Cache Keys ──────── */
    storage: {
        certificationKey: 'logicArchitect_certification',
    },

    /* ──────── Template Selection ──────── */
    defaultTemplate: 'formal',
};

export default defaultConfig;
