// Suggested file: /backend/services/NodeService.ts

import {Node} from "@/backend/database/models/NodeModel";
import {getTables} from "@/backend/database/tables/tables";
import axios from "axios";
import * as crypto from "node:crypto";

// Enum for node status
export enum NodeStatus {
    ONLINE = 'online',
    OFFLINE = 'offline'
}

// The Nodes class now manages interactions with Node data
export class Nodes {
    node: Node;

    constructor(node: Node) {
        this.node = node;
    }


    async sendRequest(endpoint: string, method: 'GET' | 'POST' = 'GET', data?: Record<string, any>): Promise<any> {
        const url = `${this.node.ssl ? 'https' : 'http'}://${this.node.ip}:${this.node.port}${endpoint}`;
        try {
            const response = await axios({
                method,
                url,
                data: {
                    token: process.env.TOKEN,
                    ...data
                },
                timeout: 500000, // 5 seconds timeout
                maxContentLength: 60 * 1024 * 1024 * 1024 * 1024 * 1024 * 1024,
                maxBodyLength: 60 * 1024 * 1024
            });
            return response.data;
        } catch (e) {
            // @ts-ignore
            console.error(e.response?.data || e.message)
            // @ts-ignore
            throw new Error(`Failed to send request to node: ${e.message}`);
        }
    }


    /**
     * Checks the live status of the node by making an API call.
     * @returns {Promise<NodeStatus>} The current status (ONLINE or OFFLINE).
     */
    async getStatus(): Promise<{ status: NodeStatus, error?: string }> {
        try {
            const url = `${this.node.ssl ? 'https' : 'http'}://${this.node.ip}:${this.node.port}/api/v1/status`
            const response = await axios.post(url, {
                token: process.env.TOKEN
            })
            if (response.status === 200) {
                return {
                    status: NodeStatus.ONLINE
                }
            } else {
                return {
                    status: NodeStatus.OFFLINE,
                    error: `Unexpected response status: ${response.status}`
                }
            }
        } catch (error) {
            return {
                status: NodeStatus.OFFLINE,
                error: (error as Error).message
            }
        }
    }

    /**
     * Updates the properties of this node in the database.
     * @param data - The new data for the node.
     */
    async update(data: { name: string, ip: string, port: number, sftp: number, ssl: boolean, location?: string }): Promise<void> {
        this.node.name = data.name;
        this.node.ip = data.ip;
        this.node.port = data.port;
        this.node.sftp = data.sftp;
        this.node.ssl = data.ssl;
        if (data.location !== undefined) this.node.location = data.location;
        await this.node.save();
    }

    /**
     * Deletes this node from the database.
     */
    async delete(): Promise<void> {
        await this.node.delete();
    }

    /**
     * Returns a clean JSON representation of the node.
     */
    toJSON() {
        return {
            uuid: this.node.id,
            ...this.node.toJSON(),
            location: this.node.location || null
        };
    }


    getUrl(): string {
        const protocol = this.node.ssl ? "https" : "http"
        return `${protocol}://${this.node.ip}:${this.node.port}`
    }

    // --- Static Methods for General Node Management ---

    /**
     * Fetches a single node by its UUID.
     * @param uuid - The UUID of the node.
     * @returns {Promise<Nodes | null>} A Nodes instance or null if not found.
     */
    static async getNode(uuid: string): Promise<Nodes | null> {
        const tables = await getTables();
        const node = await tables.nodeTable.get(uuid);
        return node ? new Nodes(node) : null;
    }

    /**
     * Fetches all nodes from the database.
     * @returns {Promise<Nodes[]>} An array of Nodes instances.
     */
    static async getAllNodes(): Promise<Nodes[]> {
        const tables = await getTables();
        const nodes = await tables.nodeTable.getAll();
        return nodes.map(node => new Nodes(node));
    }

    /**
     * Creates a new node in the database.
     * @param data - The data for the new node.
     * @returns {Promise<Nodes>} An instance of the newly created node.
     */
    static async createNode(data: { name: string, ip: string, port: number, sftp: number, ssl: boolean, location?: string }): Promise<Nodes> {
        const tables = await getTables();
        const newUuid = crypto.randomUUID();
        const newNodeModel = await tables.nodeTable.insert(newUuid, data);
        return new Nodes(newNodeModel);
    }




    /**
     * Finds a single node by its name.
     * @param name - The name of the node to find.
     * @returns {Promise<Nodes | null>} A Nodes instance or null if not found.
     */
    static async findByName(name: string): Promise<Nodes | null> {
        const tables = await getTables();
        const nodes = await tables.nodeTable.findByParam("name", name);
        return nodes.length > 0 ? new Nodes(nodes[0]) : null;
    }
}