classDiagram
direction BT
class activities {
   bigint creator_id
   varchar(50) name
   timestamp with time zone created_at
   date start_date
   date end_date
   integer score
   text icon
   text description
   bigint id
}
class class_members {
   bigint class_id
   bigint user_id
   varchar(20) role_in_class
   timestamp with time zone created_at
   timestamp with time zone updated_at
   bigint id
}
class classes {
   bigint school_id
   varchar(10) grade
   varchar(10) suffix
   varchar(10) academic_year
   timestamp with time zone created_at
   timestamp with time zone updated_at
   bigint id
}
class difficulty_rewards {
   integer multiplier
   varchar(20) difficulty
}
class document_chunks {
   bigint document_id
   text content
   vector(768) embedding
   integer chunk_index
   integer page_number
   jsonb metadata
   timestamp created_at
   bigint id
}
class documents {
   bigint user_id
   text source_uri
   text display_name
   text file_type
   integer total_pages
   integer total_chunks
   jsonb metadata
   timestamp created_at
   timestamp updated_at
   bigint id
}
class games {
   varchar(20) type
   varchar(50) name
   varchar(20) difficulty
   text icon
   text description
   timestamp with time zone created_at
   bigint id
}
class items {
   varchar(20) type
   varchar(50) name
   text icon
   text description
   integer price
   timestamp with time zone created_at
   bigint id
}
class missions {
   varchar(20) type
   varchar(100) name
   varchar(20) difficulty
   text icon
   text description
   integer scores
   jsonb requirements
   timestamp with time zone created_at
   bigint id
}
class roles {
   varchar(20) name
   bigint id
}
class schools {
   varchar(100) name
   varchar(255) address
   varchar(20) phone
   varchar(255) email
   timestamp with time zone created_at
   timestamp with time zone updated_at
   bigint id
}
class user_activities {
   bigint activity_id
   bigint user_id
   varchar(50) role_in_group
   boolean completed
   timestamp with time zone created_at
   timestamp with time zone updated_at
   bigint id
}
class user_game_scores {
   bigint user_id
   bigint game_id
   integer scores
   jsonb metadata
   timestamp with time zone created_at
   bigint id
}
class user_items {
   bigint user_id
   bigint item_id
   timestamp with time zone created_at
   bigint id
}
class user_missions {
   bigint user_id
   bigint mission_id
   date date
   jsonb progress
   boolean completed
   timestamp with time zone created_at
   timestamp with time zone updated_at
   bigint id
}
class user_profiles {
   bigint user_id
   varchar(50) nickname
   jsonb equipped_items
   jsonb preferences
   jsonb privacy_settings
   timestamp with time zone created_at
   timestamp with time zone updated_at
   bigint id
}
class user_roles {
   bigint user_id
   bigint role_id
}
class users {
   varchar(20) username
   varchar(255) email
   varchar(255) password
   integer points
   boolean is_active
   varchar(10) educator_status
   bigint school_id
   timestamp with time zone created_at
   timestamp with time zone updated_at
   bigint id
}

activities  -->  users : creator_id:id
class_members  -->  classes : class_id:id
class_members  -->  users : user_id:id
classes  -->  schools : school_id:id
document_chunks  -->  documents : document_id:id
documents  -->  users : user_id:id
games  -->  difficulty_rewards : difficulty
missions  -->  difficulty_rewards : difficulty
user_activities  -->  activities : activity_id:id
user_activities  -->  users : user_id:id
user_game_scores  -->  games : game_id:id
user_game_scores  -->  users : user_id:id
user_items  -->  items : item_id:id
user_items  -->  users : user_id:id
user_missions  -->  missions : mission_id:id
user_missions  -->  users : user_id:id
user_profiles  -->  users : user_id:id
user_roles  -->  roles : role_id:id
user_roles  -->  users : user_id:id
users  -->  schools : school_id:id
