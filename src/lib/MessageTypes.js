const Types = {
    1000 : 'trx_message_type',
    1001 : 'block_message_type',
    5000 : 'core_message_type_first',
    5001 : 'item_ids_inventory_message_type',
    5002 : 'blockchain_item_ids_inventory_message_type',
    5003 : 'fetch_blockchain_item_ids_message_type',
    5004 : 'fetch_items_message_type',
    5005 : 'item_not_available_message_type',
    5006 : 'hello_message_type',
    5007 : 'connection_accepted_message_type',
    5008 : 'connection_rejected_message_type',
    5009 : 'address_request_message_type',
    5010 : 'address_message_type',
    5011 : 'closing_connection_message_type',
    5012 : 'current_time_request_message_type',
    5013 : 'current_time_reply_message_type',
    5014 : 'check_firewall_message_type',
    5015 : 'check_firewall_reply_message_type',
    5016 : 'get_current_connections_request_message_type',
    5017 : 'get_current_connections_reply_message_type',
    5099 : 'core_message_type_last'
}
const Structures = {
    'trx_message_type': {

    },
    'block_message_type': {

    },
    'core_message_type_first': {

    },
    'item_ids_inventory_message_type': {

    },
    'blockchain_item_ids_inventory_message_type': {

    },
    'fetch_blockchain_item_ids_message_type': {

    },
    'fetch_items_message_type': {

    },
    'item_not_available_message_type': {

    },
    'hello_message_type': [
        ['user_agent','string'],
        ['core_protocol_version','uint32'],
        ['inbound_address','ipaddress'],
        ['inbound_port','uint16'],
        ['outbound_port','uint16'],
        ['node_public_key','publickey'],
        ['signed_shared_secret','signature'],
        ['chain_id','sha256'],
        ['user_data','variant_object']
    ],
    'connection_accepted_message_type': []

    ,
    'connection_rejected_message_type': {

    },
    'address_request_message_type': []

    ,
    'address_message_type': [['_vector','address_info_array']]

    ,
    'closing_connection_message_type': [
        ['reason_for_closing','string'],
        ['closing_due_to_error','uint8'],
    ]

    ,
    'current_time_request_message_type': {

    },
    'current_time_reply_message_type': {

    },
    'check_firewall_message_type': {

    },
    'check_firewall_reply_message_type': {

    },
    'get_current_connections_request_message_type': {

    },
    'get_current_connections_reply_message_type': {

    },
    'core_message_type_last': {

    },
}
export {Types,Structures};