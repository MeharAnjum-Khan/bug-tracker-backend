const Project = require('../models/Project');
const User = require('../models/User');

/**
 * @desc    Create a new project
 * @route   POST /api/projects
 * @access  Private
 */
exports.createProject = async (req, res) => {
    try {
        const { name, description } = req.body;

        const project = await Project.create({
            name,
            description,
            owner: req.user.id,
            teamMembers: [{ user: req.user.id, role: 'Admin' }],
        });

        const populatedProject = await Project.findById(project._id)
            .populate('owner', 'name email')
            .populate('teamMembers.user', 'name email');

        res.status(201).json(populatedProject);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Get all projects for a user (owned or member)
 * @route   GET /api/projects
 * @access  Private
 */
exports.getProjects = async (req, res) => {
    try {
        const projects = await Project.find({
            'teamMembers.user': req.user.id,
        }).populate('owner', 'name email');

        res.json(projects);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Get single project by ID
 * @route   GET /api/projects/:id
 * @access  Private
 */
exports.getProjectById = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('owner', 'name email')
            .populate('teamMembers.user', 'name email');

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check if user is member of project
        if (!project.teamMembers.some(member => member.user?._id.toString() === req.user.id)) {
            return res.status(403).json({ message: 'Not authorized to view this project' });
        }

        res.json(project);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Update project
 * @route   PUT /api/projects/:id
 * @access  Private
 */
exports.updateProject = async (req, res) => {
    try {
        let project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check if user is owner
        if (project.owner.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to update this project' });
        }

        project = await Project.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        res.json(project);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Delete project
 * @route   DELETE /api/projects/:id
 * @access  Private
 */
exports.deleteProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check if user is owner
        if (project.owner.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to delete this project' });
        }

        await project.deleteOne();

        res.json({ message: 'Project removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
/**
 * @desc    Add team member to project
 * @route   POST /api/projects/:id/members
 * @access  Private (Owner only)
 */
exports.addMember = async (req, res) => {
    try {
        const { email } = req.body;
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check if user is owner
        if (project.owner.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to manage team for this project' });
        }

        // Find user by email
        const userToAdd = await User.findOne({ email: email.toLowerCase() });
        if (!userToAdd) {
            return res.status(404).json({ message: 'User not found with this email' });
        }

        // Cannot add the owner as a member (they are already implied)
        if (userToAdd._id.toString() === project.owner.toString()) {
            return res.status(400).json({ message: 'User is the project owner' });
        }

        // Check if user is already a member
        if (project.teamMembers.some(m => m.user.toString() === userToAdd._id.toString())) {
            return res.status(400).json({ message: 'User is already a member of this project' });
        }

        const { role } = req.body;
        project.teamMembers.push({ user: userToAdd._id, role: role || 'Developer' });
        await project.save();

        const updatedProject = await Project.findById(project._id)
            .populate('owner', 'name email')
            .populate('teamMembers.user', 'name email');

        res.json(updatedProject);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Remove team member from project
 * @route   DELETE /api/projects/:id/members/:userId
 * @access  Private (Owner only)
 */
exports.removeMember = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check if user is owner
        if (project.owner.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to manage team for this project' });
        }

        // Cannot remove owner
        if (req.params.userId === project.owner.toString()) {
            return res.status(400).json({ message: 'Cannot remove the project owner from the team' });
        }

        // Check if user is a member
        if (!project.teamMembers.some(m => m.user.toString() === req.params.userId)) {
            return res.status(400).json({ message: 'User is not a member of this project' });
        }

        project.teamMembers = project.teamMembers.filter(
            m => m.user.toString() !== req.params.userId
        );
        await project.save();

        const updatedProject = await Project.findById(project._id)
            .populate('owner', 'name email')
            .populate('teamMembers.user', 'name email');

        res.json(updatedProject);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
